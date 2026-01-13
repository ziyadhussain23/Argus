package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.entity.Alert;
import nightswatch.argus.entity.Notification;
import nightswatch.argus.entity.User;
import nightswatch.argus.repository.NotificationRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;

    private static final int MAX_RETRIES = 3;

    @Async
    @Transactional
    public void sendAlertNotification(Alert alert) {
        User owner = alert.getServer().getOwner();
        
        Notification notification = Notification.builder()
                .alert(alert)
                .recipient(owner)
                .channel(Notification.NotificationChannel.EMAIL)
                .subject(alert.getTitle())
                .content(alert.getMessage())
                .status(Notification.NotificationStatus.PENDING)
                .build();
        
        notification = notificationRepository.save(notification);
        
        sendEmail(notification);
    }

    private void sendEmail(Notification notification) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(notification.getRecipient().getEmail());
            message.setSubject("[Argus Alert] " + notification.getSubject());
            message.setText(buildEmailContent(notification));
            
            mailSender.send(message);
            
            notification.markSent();
            notificationRepository.save(notification);
            log.info("Email notification sent to: {}", notification.getRecipient().getEmail());
            
        } catch (Exception e) {
            notification.markFailed(e.getMessage());
            notificationRepository.save(notification);
            log.error("Failed to send email notification: {}", e.getMessage());
        }
    }

    private String buildEmailContent(Notification notification) {
        Alert alert = notification.getAlert();
        
        return String.format("""
                ========================================
                ARGUS MONITORING ALERT
                ========================================
                
                %s
                
                ----------------------------------------
                Alert Details:
                ----------------------------------------
                Server: %s
                Severity: %s
                Triggered At: %s
                
                ----------------------------------------
                
                This is an automated message from Argus Monitoring System.
                Please do not reply to this email.
                """,
                alert.getMessage(),
                alert.getServer().getName(),
                alert.getSeverity(),
                alert.getTriggeredAt()
        );
    }

    @Scheduled(fixedRate = 60000) // Every minute
    @Transactional
    public void retryFailedNotifications() {
        List<Notification> failedNotifications = notificationRepository.findFailedNotificationsForRetry(MAX_RETRIES);
        
        for (Notification notification : failedNotifications) {
            log.info("Retrying notification {} (attempt {})", notification.getId(), notification.getRetryCount() + 1);
            
            if (notification.getChannel() == Notification.NotificationChannel.EMAIL) {
                sendEmail(notification);
            }
        }
    }

    @Scheduled(fixedRate = 30000) // Every 30 seconds
    @Transactional
    public void processPendingNotifications() {
        List<Notification> pending = notificationRepository.findPendingNotifications();
        
        for (Notification notification : pending) {
            if (notification.getChannel() == Notification.NotificationChannel.EMAIL) {
                sendEmail(notification);
            }
        }
    }
}
