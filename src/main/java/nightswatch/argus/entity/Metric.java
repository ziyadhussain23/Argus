package nightswatch.argus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "metrics", indexes = {
    @Index(name = "idx_metrics_server_timestamp", columnList = "server_id, timestamp"),
    @Index(name = "idx_metrics_type_timestamp", columnList = "metric_type, timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Metric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_id", nullable = false)
    private Server server;

    @Enumerated(EnumType.STRING)
    @Column(name = "metric_type", nullable = false)
    private MetricType metricType;

    @Column(name = "metric_value", nullable = false)
    private Double value;

    @Column(name = "unit")
    private String unit;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "additional_info")
    private String additionalInfo;

    public enum MetricType {
        CPU_USAGE,
        MEMORY_USAGE,
        MEMORY_TOTAL,
        MEMORY_AVAILABLE,
        DISK_USAGE,
        DISK_TOTAL,
        DISK_AVAILABLE,
        NETWORK_IN,
        NETWORK_OUT,
        PROCESS_COUNT,
        UPTIME,
        LOAD_AVERAGE,
        CUSTOM
    }

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
