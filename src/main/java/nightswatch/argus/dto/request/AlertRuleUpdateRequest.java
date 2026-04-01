package nightswatch.argus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import nightswatch.argus.entity.AlertRule;
import nightswatch.argus.entity.Metric;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRuleUpdateRequest {

    @NotBlank(message = "Rule name is required")
    private String name;

    private String description;

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
