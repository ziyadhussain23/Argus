package nightswatch.argus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import nightswatch.argus.entity.AlertRule;
import nightswatch.argus.entity.Metric;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRuleRequest {

    @NotBlank(message = "Rule name is required")
    private String name;

    private String description;

    @NotNull(message = "Server ID is required")
    private Long serverId;

    @NotNull(message = "Metric type is required")
    private Metric.MetricType metricType;

    @NotNull(message = "Condition operator is required")
    private AlertRule.ConditionOperator conditionOperator;

    @NotNull(message = "Threshold value is required")
    private Double thresholdValue;

    private Integer durationSeconds;

    @NotNull(message = "Severity is required")
    private AlertRule.AlertSeverity severity;

    private Integer cooldownMinutes;
}
