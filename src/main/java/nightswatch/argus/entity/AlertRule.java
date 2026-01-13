package nightswatch.argus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alert_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_id", nullable = false)
    private Server server;

    @Enumerated(EnumType.STRING)
    @Column(name = "metric_type", nullable = false)
    private Metric.MetricType metricType;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_operator", nullable = false)
    private ConditionOperator conditionOperator;

    @Column(name = "threshold_value", nullable = false)
    private Double thresholdValue;

    @Column(name = "duration_seconds")
    private Integer durationSeconds; // How long condition must be true

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    private AlertSeverity severity;

    @Builder.Default
    @Column(name = "is_enabled")
    private Boolean isEnabled = true;

    @Builder.Default
    @Column(name = "cooldown_minutes")
    private Integer cooldownMinutes = 5; // Minimum time between repeated alerts

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ConditionOperator {
        GREATER_THAN,
        LESS_THAN,
        GREATER_THAN_OR_EQUAL,
        LESS_THAN_OR_EQUAL,
        EQUALS,
        NOT_EQUALS
    }

    public enum AlertSeverity {
        INFO, WARNING, CRITICAL
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean evaluate(Double currentValue) {
        if (currentValue == null) return false;
        
        return switch (conditionOperator) {
            case GREATER_THAN -> currentValue > thresholdValue;
            case LESS_THAN -> currentValue < thresholdValue;
            case GREATER_THAN_OR_EQUAL -> currentValue >= thresholdValue;
            case LESS_THAN_OR_EQUAL -> currentValue <= thresholdValue;
            case EQUALS -> currentValue.equals(thresholdValue);
            case NOT_EQUALS -> !currentValue.equals(thresholdValue);
        };
    }
}
