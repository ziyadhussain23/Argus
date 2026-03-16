package nightswatch.argus.dto.response;

import lombok.*;
import nightswatch.argus.entity.AlertRule;
import nightswatch.argus.entity.Metric;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRuleResponse {

    private Long id;
    private String name;
    private String description;
    private Long serverId;
    private String serverName;
    private Metric.MetricType metricType;
    private AlertRule.ConditionOperator conditionOperator;
    private Double thresholdValue;
    private Integer durationSeconds;
    private AlertRule.AlertSeverity severity;
    private Boolean isEnabled;
    private Integer cooldownMinutes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AlertRuleResponse fromEntity(AlertRule rule) {
        Long serverId = rule.getServer() != null ? rule.getServer().getId() : null;
        String serverName = rule.getServer() != null ? rule.getServer().getName() : null;
        return AlertRuleResponse.builder()
                .id(rule.getId())
                .name(rule.getName())
                .description(rule.getDescription())
                .serverId(serverId)
                .serverName(serverName)
                .metricType(rule.getMetricType())
                .conditionOperator(rule.getConditionOperator())
                .thresholdValue(rule.getThresholdValue())
                .durationSeconds(rule.getDurationSeconds())
                .severity(rule.getSeverity())
                .isEnabled(rule.getIsEnabled())
                .cooldownMinutes(rule.getCooldownMinutes())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }
}
