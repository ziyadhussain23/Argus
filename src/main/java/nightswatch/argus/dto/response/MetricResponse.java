package nightswatch.argus.dto.response;

import lombok.*;
import nightswatch.argus.entity.Metric;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetricResponse {

    private Long id;
    private Metric.MetricType metricType;
    private Double value;
    private String unit;
    private LocalDateTime timestamp;
    private String additionalInfo;

    public static MetricResponse fromEntity(Metric metric) {
        return MetricResponse.builder()
                .id(metric.getId())
                .metricType(metric.getMetricType())
                .value(metric.getValue())
                .unit(metric.getUnit())
                .timestamp(metric.getTimestamp())
                .additionalInfo(metric.getAdditionalInfo())
                .build();
    }
}
