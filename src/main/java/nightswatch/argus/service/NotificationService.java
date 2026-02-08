package nightswatch.argus.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.entity.Alert;
import nightswatch.argus.entity.AlertRule;
import nightswatch.argus.entity.Metric;
import nightswatch.argus.entity.Notification;
import nightswatch.argus.entity.User;
import nightswatch.argus.exception.SmsDeliveryException;
import nightswatch.argus.exception.SmsRateLimitExceededException;
import nightswatch.argus.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;
    private final NotificationPreferenceService preferenceService;
    private final SmsService smsService;
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private static final int MAX_RETRIES = 3;

    @Async
    @Transactional
    public void sendAlertNotification(Alert alert) {
        User owner = alert.getServer().getOwner();
        boolean isCritical = alert.getSeverity() == AlertRule.AlertSeverity.CRITICAL;
        
        // Send Email notification if enabled
        if (preferenceService.isEmailEnabled(owner.getId())) {
            Notification emailNotification = Notification.builder()
                    .alert(alert)
                    .recipient(owner)
                    .channel(Notification.NotificationChannel.EMAIL)
                    .subject(alert.getTitle())
                    .content(alert.getMessage())
                    .status(Notification.NotificationStatus.PENDING)
                    .build();
            
            emailNotification = notificationRepository.save(emailNotification);
            sendEmail(emailNotification);
        }
        
        // Send SMS notification if enabled and conditions are met
        if (preferenceService.shouldSendSms(owner, isCritical)) {
            Notification smsNotification = Notification.builder()
                    .alert(alert)
                    .recipient(owner)
                    .channel(Notification.NotificationChannel.SMS)
                    .subject(alert.getTitle())
                    .content(alert.getMessage())
                    .status(Notification.NotificationStatus.PENDING)
                    .build();
            
            smsNotification = notificationRepository.save(smsNotification);
            sendSms(smsNotification);
        }
    }

    private void sendSms(Notification notification) {
        try {
            smsService.sendAlertSms(notification.getAlert(), notification);
            notification.markSent();
            notificationRepository.save(notification);
            log.info("SMS notification sent for alert: {}", notification.getAlert().getId());
        } catch (SmsRateLimitExceededException e) {
            notification.markFailed("Rate limit exceeded: " + e.getMessage());
            notificationRepository.save(notification);
            log.warn("SMS rate limit exceeded for user: {}", notification.getRecipient().getUsername());
        } catch (SmsDeliveryException e) {
            notification.markFailed(e.getErrorCode() + ": " + e.getMessage());
            notificationRepository.save(notification);
            log.error("Failed to send SMS notification: {}", e.getMessage());
        } catch (Exception e) {
            notification.markFailed(e.getMessage());
            notificationRepository.save(notification);
            log.error("Unexpected error sending SMS notification: {}", e.getMessage());
        }
    }

    private void sendEmail(Notification notification) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            
            helper.setTo(notification.getRecipient().getEmail());
            helper.setSubject("[Argus Alert] " + notification.getSubject());
            helper.setText(buildEmailHtml(notification), true);
            
            mailSender.send(message);
            
            notification.markSent();
            notificationRepository.save(notification);
            log.info("Email notification sent to: {}", notification.getRecipient().getEmail());
            
        } catch (MessagingException e) {
            notification.markFailed(e.getMessage());
            notificationRepository.save(notification);
            log.error("Failed to send email notification: {}", e.getMessage());
        } catch (Exception e) {
            notification.markFailed(e.getMessage());
            notificationRepository.save(notification);
            log.error("Failed to send email notification: {}", e.getMessage());
        }
    }

    private String buildEmailHtml(Notification notification) {
        Alert alert = notification.getAlert();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss");
        
        // Determine severity color and emoji
        String severityColor = getSeverityColor(alert.getSeverity());
        String severityEmoji = getSeverityEmoji(alert.getSeverity());
        
        // Build action URLs
        String serverUrl = frontendUrl + "/servers/" + alert.getServer().getId();
        String alertsUrl = frontendUrl + "/alerts";
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">⚔️ Argus Alert</h1>
                                        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Server Monitoring</p>
                                    </td>
                                </tr>
                                
                                <!-- Alert Banner -->
                                <tr>
                                    <td style="background-color: %s; padding: 20px; text-align: center; border-bottom: 3px solid %s;">
                                        <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">%s %s</h2>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 30px;">
                                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid %s; margin-bottom: 25px;">
                                            <p style="color: #333333; margin: 0; font-size: 16px; line-height: 1.6; font-weight: 500;">
                                                %s
                                            </p>
                                        </div>
                                        
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                                                    <span style="color: #6c757d; font-size: 14px;">Server</span>
                                                    <p style="color: #212529; margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">🖥️ %s</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                                                    <span style="color: #6c757d; font-size: 14px;">Metric Type</span>
                                                    <p style="color: #212529; margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">📊 %s</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                                                    <span style="color: #6c757d; font-size: 14px;">Current Value</span>
                                                    <p style="color: #212529; margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">%s</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                                                    <span style="color: #6c757d; font-size: 14px;">Threshold</span>
                                                    <p style="color: #212529; margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">⚠️ %s</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0;">
                                                    <span style="color: #6c757d; font-size: 14px;">Triggered At</span>
                                                    <p style="color: #212529; margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">🕐 %s</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Action Buttons -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                            <tr>
                                                <td align="center">
                                                    <table cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="padding: 0 10px;">
                                                                <a href="%s" style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 14px; font-weight: bold; display: inline-block;">
                                                                    View Server Details
                                                                </a>
                                                            </td>
                                                            <td style="padding: 0 10px;">
                                                                <a href="%s" style="background-color: #6c757d; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 14px; font-weight: bold; display: inline-block;">
                                                                    View All Alerts
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                                            <p style="color: #6c757d; margin: 0; font-size: 13px; line-height: 1.6;">
                                                💡 <strong>Tip:</strong> You can acknowledge or resolve this alert from your Argus dashboard to update its status.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f8f8; padding: 25px; text-align: center; border-radius: 0 0 8px 8px;">
                                        <p style="color: #999999; margin: 0 0 8px 0; font-size: 13px;">
                                            This is an automated alert from Argus Server Monitoring
                                        </p>
                                        <p style="color: #999999; margin: 0; font-size: 12px;">
                                            &copy; 2026 Argus. Watch over your infrastructure, day and night.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(
                severityColor,
                severityColor,
                severityEmoji,
                alert.getSeverity(),
                severityColor,
                alert.getMessage(),
                alert.getServer().getName(),
                alert.getAlertRule().getMetricType().toString().replace("_", " "),
                formatMetricValue(alert.getMetricValue(), alert.getAlertRule().getMetricType()),
                formatMetricValue(alert.getThresholdValue(), alert.getAlertRule().getMetricType()),
                alert.getTriggeredAt().format(formatter),
                serverUrl,
                alertsUrl
        );
    }
    
    private String getSeverityColor(AlertRule.AlertSeverity severity) {
        return switch (severity) {
            case CRITICAL -> "#dc3545";
            case WARNING -> "#ffc107";
            case INFO -> "#17a2b8";
        };
    }
    
    private String getSeverityEmoji(AlertRule.AlertSeverity severity) {
        return switch (severity) {
            case CRITICAL -> "🔴";
            case WARNING -> "⚠️";
            case INFO -> "ℹ️";
        };
    }
    
    private String formatMetricValue(Double value, Metric.MetricType metricType) {
        if (value == null) return "N/A";
        
        return switch (metricType) {
            case CPU_USAGE, MEMORY_USAGE, DISK_USAGE -> String.format("%.2f%%", value);
            case LOAD_AVERAGE -> String.format("%.2f", value);
            case PROCESS_COUNT, UPTIME -> String.format("%.0f", value);
            case MEMORY_TOTAL, MEMORY_AVAILABLE, DISK_TOTAL, DISK_AVAILABLE, 
                 NETWORK_IN, NETWORK_OUT -> String.format("%.2f MB", value);
            default -> String.format("%.2f", value);
        };
    }

    @Scheduled(fixedRate = 60000) // Every minute
    @Transactional
    public void retryFailedNotifications() {
        List<Notification> failedNotifications = notificationRepository.findFailedNotificationsForRetry(MAX_RETRIES);
        
        for (Notification notification : failedNotifications) {
            log.info("Retrying notification {} (attempt {})", notification.getId(), notification.getRetryCount() + 1);
            
            switch (notification.getChannel()) {
                case EMAIL -> sendEmail(notification);
                case SMS -> sendSms(notification);
                default -> log.warn("Unsupported notification channel: {}", notification.getChannel());
            }
        }
    }

    @Scheduled(fixedRate = 30000) // Every 30 seconds
    @Transactional
    public void processPendingNotifications() {
        List<Notification> pending = notificationRepository.findPendingNotifications();
        
        for (Notification notification : pending) {
            switch (notification.getChannel()) {
                case EMAIL -> sendEmail(notification);
                case SMS -> sendSms(notification);
                default -> log.warn("Unsupported notification channel: {}", notification.getChannel());
            }
        }
    }
}
