package nightswatch.argus.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "servers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Server {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "host_address", nullable = false)
    private String hostAddress;

    @Column(name = "agent_key", nullable = false, unique = true)
    private String agentKey;

    @Column(name = "operating_system")
    private String operatingSystem;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServerStatus status;

    @Column(name = "last_heartbeat")
    private LocalDateTime lastHeartbeat;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @JsonIgnore
    @OneToMany(mappedBy = "server", cascade = CascadeType.ALL)
    private List<Metric> metrics;

    @JsonIgnore
    @OneToMany(mappedBy = "server", cascade = CascadeType.ALL)
    private List<AlertRule> alertRules;

    @JsonIgnore
    @OneToMany(mappedBy = "server", cascade = CascadeType.ALL)
    private List<Alert> alerts;

    public enum ServerStatus {
        ONLINE, OFFLINE, WARNING, CRITICAL, UNKNOWN
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ServerStatus.UNKNOWN;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
