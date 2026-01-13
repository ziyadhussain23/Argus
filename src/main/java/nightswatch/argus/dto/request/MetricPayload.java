package nightswatch.argus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import nightswatch.argus.entity.Metric;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetricPayload {

    @NotBlank(message = "Agent key is required")
    private String agentKey;

    @NotNull(message = "Metrics list cannot be null")
    private List<MetricData> metrics;

    private Long timestamp; // Unix timestamp in milliseconds

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MetricData {
        
        @NotNull(message = "Metric type is required")
        private Metric.MetricType type;
        
        @NotNull(message = "Metric value is required")
        private Double value;
        
        private String unit;
        
        private String additionalInfo;
    }
}
