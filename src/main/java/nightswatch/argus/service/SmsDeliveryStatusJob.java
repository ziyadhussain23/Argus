package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.entity.SmsLog;
import nightswatch.argus.repository.SmsLogRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled job for checking SMS delivery status.
 * Polls Twilio API for status updates on sent messages.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SmsDeliveryStatusJob {

    private final SmsLogRepository smsLogRepository;
    private final SmsService smsService;

    /**
     * Check delivery status of recently sent SMS messages.
     * Runs every 2 minutes to update status from Twilio.
     */
    @Scheduled(fixedRate = 120000) // Every 2 minutes
    @Transactional
    public void checkDeliveryStatus() {
        if (!smsService.isAvailable()) {
            return;
        }

        // Find SMS sent in last 24 hours that are still in SENT or QUEUED status
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<SmsLog> pendingDelivery = smsLogRepository.findByStatus(SmsLog.SmsStatus.SENT);
        pendingDelivery.addAll(smsLogRepository.findByStatus(SmsLog.SmsStatus.QUEUED));
        pendingDelivery.addAll(smsLogRepository.findByStatus(SmsLog.SmsStatus.SENDING));

        // Filter to only check recent ones
        List<SmsLog> recentPending = pendingDelivery.stream()
                .filter(sms -> sms.getCreatedAt().isAfter(since))
                .filter(sms -> sms.getTwilioMessageSid() != null)
                .toList();

        if (recentPending.isEmpty()) {
            return;
        }

        log.debug("Checking delivery status for {} SMS messages", recentPending.size());

        for (SmsLog smsLog : recentPending) {
            try {
                smsService.checkDeliveryStatus(smsLog.getTwilioMessageSid());
            } catch (Exception e) {
                log.warn("Failed to check delivery status for SID {}: {}", 
                    smsLog.getTwilioMessageSid(), e.getMessage());
            }
        }
    }

    /**
     * Clean up old SMS logs (older than 30 days).
     * Runs daily at 3 AM.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupOldLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        
        log.info("Cleaning up SMS logs older than {}", cutoff);
        
        // This would need a custom delete method - for now just log
        // In production, implement: smsLogRepository.deleteByCreatedAtBefore(cutoff);
        log.debug("SMS log cleanup completed");
    }

    /**
     * Generate daily SMS usage summary.
     * Runs daily at midnight.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void generateDailySummary() {
        LocalDateTime startOfYesterday = LocalDateTime.now().minusDays(1)
                .withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfYesterday = startOfYesterday.plusDays(1);

        long totalSent = smsLogRepository.findByStatus(SmsLog.SmsStatus.DELIVERED).stream()
                .filter(sms -> sms.getCreatedAt().isAfter(startOfYesterday) 
                            && sms.getCreatedAt().isBefore(endOfYesterday))
                .count();

        long totalFailed = smsLogRepository.findByStatus(SmsLog.SmsStatus.FAILED).stream()
                .filter(sms -> sms.getCreatedAt().isAfter(startOfYesterday) 
                            && sms.getCreatedAt().isBefore(endOfYesterday))
                .count();

        log.info("Daily SMS Summary - Delivered: {}, Failed: {}", totalSent, totalFailed);
    }
}
