package nightswatch.argus.dto.response;

import lombok.*;
import nightswatch.argus.entity.Alert;
import nightswatch.argus.entity.AlertRule;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertResponse {

    private Long id;
    private Long serverId;
    private String serverName;
    private String title;
    private String message;
    private AlertRule.AlertSeverity severity;
    private Alert.AlertStatus status;
    private Double metricValue;
    private Double thresholdValue;
    private LocalDateTime triggeredAt;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime resolvedAt;

    public static AlertResponse fromEntity(Alert alert) {
        return AlertResponse.builder()
                .id(alert.getId())
                .serverId(alert.getServer().getId())
                .serverName(alert.getServer().getName())
                .title(alert.getTitle())
                .message(alert.getMessage())
                .severity(alert.getSeverity())
                .status(alert.getStatus())
                .metricValue(alert.getMetricValue())
                .thresholdValue(alert.getThresholdValue())
                .triggeredAt(alert.getTriggeredAt())
                .acknowledgedAt(alert.getAcknowledgedAt())
                .resolvedAt(alert.getResolvedAt())
                .build();
    }
}
