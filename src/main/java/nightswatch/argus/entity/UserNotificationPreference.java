package nightswatch.argus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity to store user notification preferences.
 * Allows users to configure how they want to receive alerts.
 */
@Entity
@Table(name = "user_notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @Column(name = "email_enabled")
    private Boolean emailEnabled = true;

    @Builder.Default
    @Column(name = "sms_enabled")
    private Boolean smsEnabled = false;

    @Builder.Default
    @Column(name = "sms_for_critical_only")
    private Boolean smsForCriticalOnly = true;

    @Builder.Default
    @Column(name = "quiet_hours_enabled")
    private Boolean quietHoursEnabled = false;

    @Column(name = "quiet_hours_start")
    private Integer quietHoursStart; // Hour of day (0-23)

    @Column(name = "quiet_hours_end")
    private Integer quietHoursEnd; // Hour of day (0-23)

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Check if SMS notifications are allowed based on preferences.
     */
    public boolean isSmsAllowed(boolean isCritical) {
        if (!smsEnabled) {
            return false;
        }
        if (smsForCriticalOnly && !isCritical) {
            return false;
        }
        return !isInQuietHours();
    }

    /**
     * Check if current time is within quiet hours.
     */
    public boolean isInQuietHours() {
        if (!quietHoursEnabled || quietHoursStart == null || quietHoursEnd == null) {
            return false;
        }
        int currentHour = LocalDateTime.now().getHour();
        if (quietHoursStart <= quietHoursEnd) {
            return currentHour >= quietHoursStart && currentHour < quietHoursEnd;
        } else {
            // Quiet hours span midnight
            return currentHour >= quietHoursStart || currentHour < quietHoursEnd;
        }
    }
}
