package nightswatch.argus.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import nightswatch.argus.entity.Metric;
import nightswatch.argus.entity.ScheduledReport;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduledReportResponse {

    private Long id;
    private String name;
    private String format;
    private Set<Long> servers;
    private Set<String> metrics;
    private String timeframe;
    private String frequency;
    private String recipients;
    private Boolean enabled;
    private LocalDateTime lastGeneratedAt;
    private LocalDateTime nextRunAt;

    public static ScheduledReportResponse fromEntity(ScheduledReport report) {
        return ScheduledReportResponse.builder()
                .id(report.getId())
                .name(report.getName())
                .format(report.getFormat().name().toLowerCase())
                .servers(report.getServerIds())
                .metrics(report.getMetricTypes().stream().map(Metric.MetricType::name).collect(java.util.stream.Collectors.toSet()))
                .timeframe(report.getTimeframe())
                .frequency(report.getFrequency().name().toLowerCase())
                .recipients(report.getRecipients())
                .enabled(report.getEnabled())
                .lastGeneratedAt(report.getLastGeneratedAt())
                .nextRunAt(report.getNextRunAt())
                .build();
    }
}
