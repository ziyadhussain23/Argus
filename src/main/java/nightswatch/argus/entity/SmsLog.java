package nightswatch.argus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity to log all SMS messages sent.
 * Used for auditing, debugging, and rate limiting.
 */
@Entity
@Table(name = "sms_logs", indexes = {
    @Index(name = "idx_sms_logs_user_created", columnList = "user_id, created_at"),
    @Index(name = "idx_sms_logs_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmsLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_id")
    private Notification notification;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "message_content", nullable = false, length = 320)
    private String messageContent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SmsStatus status;

    @Column(name = "twilio_message_sid", length = 50)
    private String twilioMessageSid;

    @Column(name = "error_code", length = 20)
    private String errorCode;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "segments_count")
    private Integer segmentsCount;

    @Column(name = "price")
    private Double price;

    @Column(name = "price_unit", length = 10)
    private String priceUnit;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    public enum SmsStatus {
        PENDING,
        QUEUED,
        SENDING,
        SENT,
        DELIVERED,
        FAILED,
        UNDELIVERED
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = SmsStatus.PENDING;
        }
    }

    public void markSent(String messageSid) {
        this.status = SmsStatus.SENT;
        this.twilioMessageSid = messageSid;
        this.sentAt = LocalDateTime.now();
    }

    public void markFailed(String errorCode, String errorMessage) {
        this.status = SmsStatus.FAILED;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage != null && errorMessage.length() > 500 
            ? errorMessage.substring(0, 500) : errorMessage;
    }

    public void markDelivered() {
        this.status = SmsStatus.DELIVERED;
        this.deliveredAt = LocalDateTime.now();
    }
}
