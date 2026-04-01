package nightswatch.argus.dto.response;

import lombok.*;
import nightswatch.argus.entity.Notification;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private Long id;
    private Long alertId;
    private Notification.NotificationChannel channel;
    private String subject;
    private String content;
    private Notification.NotificationStatus status;
    private LocalDateTime sentAt;
    private String errorMessage;
    private Integer retryCount;
    private LocalDateTime createdAt;

    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .alertId(notification.getAlert() != null ? notification.getAlert().getId() : null)
                .channel(notification.getChannel())
                .subject(notification.getSubject())
                .content(notification.getContent())
                .status(notification.getStatus())
                .sentAt(notification.getSentAt())
                .errorMessage(notification.getErrorMessage())
                .retryCount(notification.getRetryCount())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
