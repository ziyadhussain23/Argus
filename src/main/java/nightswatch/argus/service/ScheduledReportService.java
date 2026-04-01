package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.dto.request.ScheduledReportRequest;
import nightswatch.argus.dto.response.ScheduledReportResponse;
import nightswatch.argus.entity.Metric;
import nightswatch.argus.entity.ScheduledReport;
import nightswatch.argus.entity.Server;
import nightswatch.argus.entity.User;
import nightswatch.argus.exception.BadRequestException;
import nightswatch.argus.repository.MetricRepository;
import nightswatch.argus.repository.ScheduledReportRepository;
import nightswatch.argus.repository.ServerRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledReportService {

    private final ScheduledReportRepository scheduledReportRepository;
    private final ServerRepository serverRepository;
    private final MetricRepository metricRepository;
    private final EmailService emailService;

    public List<ScheduledReportResponse> getReports(User owner) {
        return scheduledReportRepository.findByOwnerIdOrderByUpdatedAtDesc(owner.getId()).stream()
                .map(ScheduledReportResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ScheduledReportResponse createReport(User owner, ScheduledReportRequest request) {
        ScheduledReport report = ScheduledReport.builder()
                .owner(owner)
                .build();
        applyRequest(report, owner, request);
        report = scheduledReportRepository.save(report);
        return ScheduledReportResponse.fromEntity(report);
    }

    @Transactional
    public ScheduledReportResponse updateReport(Long reportId, User owner, ScheduledReportRequest request) {
        ScheduledReport report = scheduledReportRepository.findById(reportId)
                .orElseThrow(() -> new BadRequestException("Scheduled report not found"));

        ensureOwnership(report, owner);
        applyRequest(report, owner, request);
        report = scheduledReportRepository.save(report);
        return ScheduledReportResponse.fromEntity(report);
    }

    @Transactional
    public void deleteReport(Long reportId, User owner) {
        ScheduledReport report = scheduledReportRepository.findById(reportId)
                .orElseThrow(() -> new BadRequestException("Scheduled report not found"));
        ensureOwnership(report, owner);
        scheduledReportRepository.delete(report);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processAutoReports() {
        LocalDateTime now = LocalDateTime.now();
        List<ScheduledReport> dueReports = scheduledReportRepository.findDueAutoReports(now);
        if (dueReports.isEmpty()) {
            return;
        }

        for (ScheduledReport report : dueReports) {
            try {
                sendReportEmail(report, now);
                report.setLastGeneratedAt(now);
            } catch (Exception ex) {
                log.error("Failed sending scheduled report {}: {}", report.getId(), ex.getMessage(), ex);
            } finally {
                report.setNextRunAt(now.plus(parseTimeframe(report.getTimeframe())));
                scheduledReportRepository.save(report);
            }
        }
    }

    private void applyRequest(ScheduledReport report, User owner, ScheduledReportRequest request) {
        Set<Long> serverIds = request.getServers() != null ? new LinkedHashSet<>(request.getServers()) : new LinkedHashSet<>();
        validateServerOwnership(serverIds, owner);

        Set<Metric.MetricType> metricTypes = parseMetricTypes(request.getMetrics());
        if (metricTypes.isEmpty()) {
            throw new BadRequestException("At least one metric must be selected");
        }

        ScheduledReport.ReportFormat format = parseFormat(request.getFormat());
        ScheduledReport.ReportFrequency frequency = parseFrequency(request.getFrequency());
        String timeframe = normalizeTimeframe(request.getTimeframe());
        String recipients = normalizeRecipients(request.getRecipients());

        if (frequency == ScheduledReport.ReportFrequency.AUTO && recipients.isBlank()) {
            throw new BadRequestException("Recipients are required for auto email reports");
        }

        report.setName(request.getName().trim());
        report.setFormat(format);
        report.setServerIds(serverIds);
        report.setMetricTypes(metricTypes);
        report.setTimeframe(timeframe);
        report.setFrequency(frequency);
        report.setRecipients(recipients);
        report.setEnabled(Boolean.TRUE.equals(request.getEnabled()) && frequency == ScheduledReport.ReportFrequency.AUTO);

        if (report.getEnabled()) {
            report.setNextRunAt(LocalDateTime.now().plus(parseTimeframe(timeframe)));
        } else {
            report.setNextRunAt(null);
        }
    }

    private void sendReportEmail(ScheduledReport report, LocalDateTime now) {
        Duration timeframe = parseTimeframe(report.getTimeframe());
        LocalDateTime start = now.minus(timeframe);

        List<Server> targetServers = resolveTargetServers(report);
        if (targetServers.isEmpty()) {
            throw new BadRequestException("No servers available for scheduled report");
        }

        String html = buildReportHtml(report, targetServers, start, now);
        String subject = "Argus Scheduled Report: " + report.getName();
        List<String> recipients = splitRecipients(report.getRecipients());

        if (recipients.isEmpty()) {
            throw new BadRequestException("No report recipients configured");
        }

        emailService.sendInfrastructureReportEmail(recipients, subject, html);
        log.info("Sent scheduled report {} to {} recipients", report.getId(), recipients.size());
    }

    private String buildReportHtml(ScheduledReport report, List<Server> servers, LocalDateTime start, LocalDateTime end) {
        StringBuilder sb = new StringBuilder();
        sb.append("<html><body style=\"font-family: Arial, sans-serif;\">");
        sb.append("<h2>Argus Infrastructure Report</h2>");
        sb.append("<p><strong>Report:</strong> ").append(escape(report.getName())).append("</p>");
        sb.append("<p><strong>Time Frame:</strong> ").append(escape(report.getTimeframe())).append(" | ");
        sb.append("<strong>Generated:</strong> ").append(end).append("</p>");
        sb.append("<table border=\"1\" cellspacing=\"0\" cellpadding=\"6\" style=\"border-collapse: collapse;\">");
        sb.append("<tr><th>Server</th><th>Metric</th><th>Latest</th><th>Average</th><th>Max</th><th>Min</th><th>Points</th></tr>");

        int totalRows = 0;
        for (Server server : servers) {
            for (Metric.MetricType metricType : report.getMetricTypes()) {
                List<Metric> metrics = metricRepository.findByServerTypeAndTimeRange(server, metricType, start, end);
                if (metrics.isEmpty()) {
                    continue;
                }

                metrics.sort(Comparator.comparing(Metric::getTimestamp));
                double latest = metrics.get(metrics.size() - 1).getValue();
                double avg = metrics.stream().mapToDouble(Metric::getValue).average().orElse(0.0);
                double max = metrics.stream().mapToDouble(Metric::getValue).max().orElse(0.0);
                double min = metrics.stream().mapToDouble(Metric::getValue).min().orElse(0.0);

                sb.append("<tr>")
                        .append("<td>").append(escape(server.getName())).append("</td>")
                        .append("<td>").append(metricType.name()).append("</td>")
                        .append("<td>").append(String.format(Locale.US, "%.2f", latest)).append("</td>")
                        .append("<td>").append(String.format(Locale.US, "%.2f", avg)).append("</td>")
                        .append("<td>").append(String.format(Locale.US, "%.2f", max)).append("</td>")
                        .append("<td>").append(String.format(Locale.US, "%.2f", min)).append("</td>")
                        .append("<td>").append(metrics.size()).append("</td>")
                        .append("</tr>");
                totalRows++;
            }
        }
        sb.append("</table>");
        if (totalRows == 0) {
            sb.append("<p>No metric data was available for the selected servers and metrics in this timeframe.</p>");
        }
        sb.append("<p style=\"margin-top: 16px; color: #666; font-size: 12px;\">This email was generated automatically by Argus.</p>");
        sb.append("</body></html>");
        return sb.toString();
    }

    private List<Server> resolveTargetServers(ScheduledReport report) {
        if (report.getServerIds() == null || report.getServerIds().isEmpty()) {
            return serverRepository.findByOwner(report.getOwner());
        }
        return report.getServerIds().stream()
                .map(serverId -> serverRepository.findById(serverId).orElse(null))
                .filter(server -> server != null && server.getOwner().getId().equals(report.getOwner().getId()))
                .toList();
    }

    private void validateServerOwnership(Set<Long> serverIds, User owner) {
        for (Long serverId : serverIds) {
            Server server = serverRepository.findById(serverId)
                    .orElseThrow(() -> new BadRequestException("Server not found: " + serverId));
            if (!server.getOwner().getId().equals(owner.getId())) {
                throw new BadRequestException("Access denied for server: " + serverId);
            }
        }
    }

    private Set<Metric.MetricType> parseMetricTypes(Set<String> rawMetricTypes) {
        Set<Metric.MetricType> parsed = new LinkedHashSet<>();
        if (rawMetricTypes == null) {
            return parsed;
        }
        for (String raw : rawMetricTypes) {
            try {
                parsed.add(Metric.MetricType.valueOf(raw.trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Unsupported metric type: " + raw);
            }
        }
        return parsed;
    }

    private ScheduledReport.ReportFormat parseFormat(String raw) {
        try {
            return ScheduledReport.ReportFormat.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new BadRequestException("Unsupported report format: " + raw);
        }
    }

    private ScheduledReport.ReportFrequency parseFrequency(String raw) {
        try {
            return ScheduledReport.ReportFrequency.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new BadRequestException("Unsupported report frequency: " + raw);
        }
    }

    private String normalizeTimeframe(String timeframe) {
        String normalized = timeframe == null ? "24h" : timeframe.trim().toLowerCase(Locale.ROOT);
        if (!Set.of("1h", "6h", "24h", "7d", "30d").contains(normalized)) {
            throw new BadRequestException("Unsupported timeframe: " + timeframe);
        }
        return normalized;
    }

    private Duration parseTimeframe(String timeframe) {
        return switch (normalizeTimeframe(timeframe)) {
            case "1h" -> Duration.ofHours(1);
            case "6h" -> Duration.ofHours(6);
            case "24h" -> Duration.ofHours(24);
            case "7d" -> Duration.ofDays(7);
            case "30d" -> Duration.ofDays(30);
            default -> Duration.ofHours(24);
        };
    }

    private String normalizeRecipients(String recipients) {
        if (recipients == null) {
            return "";
        }
        List<String> emails = splitRecipients(recipients);
        if (emails.isEmpty()) {
            return "";
        }
        return String.join(",", emails);
    }

    private List<String> splitRecipients(String recipients) {
        if (recipients == null || recipients.isBlank()) {
            return List.of();
        }
        String[] rawEmails = recipients.split(",");
        List<String> emails = new ArrayList<>();
        for (String raw : rawEmails) {
            String email = raw.trim();
            if (email.isEmpty()) {
                continue;
            }
            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                throw new BadRequestException("Invalid email recipient: " + email);
            }
            emails.add(email);
        }
        return emails;
    }

    private void ensureOwnership(ScheduledReport report, User owner) {
        if (!report.getOwner().getId().equals(owner.getId())) {
            throw new BadRequestException("Access denied");
        }
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
