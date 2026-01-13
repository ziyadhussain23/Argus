package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.dto.request.MetricPayload;
import nightswatch.argus.dto.response.MetricResponse;
import nightswatch.argus.entity.Metric;
import nightswatch.argus.entity.Server;
import nightswatch.argus.repository.MetricRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetricService {

    private final MetricRepository metricRepository;
    private final ServerService serverService;
    private final AlertEvaluationService alertEvaluationService;

    @Value("${argus.metrics.retention-days:30}")
    private int retentionDays;

    @Transactional
    public void ingestMetrics(MetricPayload payload) {
        Server server = serverService.getServerByAgentKey(payload.getAgentKey());
        
        LocalDateTime timestamp = payload.getTimestamp() != null
                ? LocalDateTime.ofInstant(Instant.ofEpochMilli(payload.getTimestamp()), ZoneId.systemDefault())
                : LocalDateTime.now();

        List<Metric> metrics = new ArrayList<>();
        
        for (MetricPayload.MetricData data : payload.getMetrics()) {
            Metric metric = Metric.builder()
                    .server(server)
                    .metricType(data.getType())
                    .value(data.getValue())
                    .unit(data.getUnit())
                    .additionalInfo(data.getAdditionalInfo())
                    .timestamp(timestamp)
                    .build();
            metrics.add(metric);
        }
        
        metricRepository.saveAll(metrics);
        
        // Update server heartbeat
        serverService.updateHeartbeat(server);
        
        // Evaluate alert rules for incoming metrics
        alertEvaluationService.evaluateMetrics(server, metrics);
        
        log.debug("Ingested {} metrics for server: {}", metrics.size(), server.getName());
    }

    public List<MetricResponse> getMetricsByServer(Server server, Metric.MetricType type, 
                                                     LocalDateTime start, LocalDateTime end) {
        List<Metric> metrics;
        
        if (type != null) {
            metrics = metricRepository.findByServerTypeAndTimeRange(server, type, start, end);
        } else {
            metrics = metricRepository.findByServerAndTimeRange(server, start, end);
        }
        
        return metrics.stream()
                .map(MetricResponse::fromEntity)
                .toList();
    }

    public MetricResponse getLatestMetric(Server server, Metric.MetricType type) {
        return metricRepository.findLatestByServerAndType(server, type)
                .map(MetricResponse::fromEntity)
                .orElse(null);
    }

    public Double getAverageMetric(Server server, Metric.MetricType type, int minutes) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
        return metricRepository.getAverageValue(server, type, since);
    }

    @Scheduled(cron = "0 0 2 * * ?") // Run at 2 AM every day
    @Transactional
    public void cleanupOldMetrics() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(retentionDays);
        int deleted = metricRepository.deleteOldMetrics(threshold);
        log.info("Cleaned up {} old metrics (older than {} days)", deleted, retentionDays);
    }
}
