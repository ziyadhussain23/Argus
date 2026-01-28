package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.config.SmsRateLimitConfig;
import nightswatch.argus.entity.User;
import nightswatch.argus.exception.SmsRateLimitExceededException;
import nightswatch.argus.repository.SmsLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for enforcing SMS rate limits to control costs and prevent abuse.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SmsRateLimiter {

    private final SmsLogRepository smsLogRepository;
    private final SmsRateLimitConfig rateLimitConfig;

    /**
     * Check if user can send an SMS based on rate limits.
     * 
     * @param user the user to check
     * @throws SmsRateLimitExceededException if rate limit is exceeded
     */
    public void checkRateLimit(User user) {
        checkHourlyLimit(user);
        checkDailyLimit(user);
    }

    /**
     * Check if user can send an SMS without throwing exception.
     * 
     * @param user the user to check
     * @return true if within rate limits
     */
    public boolean canSendSms(User user) {
        try {
            checkRateLimit(user);
            return true;
        } catch (SmsRateLimitExceededException e) {
            return false;
        }
    }

    /**
     * Get remaining SMS quota for the hour.
     * 
     * @param userId the user ID
     * @return remaining SMS count for current hour
     */
    public int getRemainingHourlyQuota(Long userId) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long sent = smsLogRepository.countByUserIdSince(userId, oneHourAgo);
        return Math.max(0, rateLimitConfig.getMaxPerHour() - (int) sent);
    }

    /**
     * Get remaining SMS quota for the day.
     * 
     * @param userId the user ID
     * @return remaining SMS count for current day
     */
    public int getRemainingDailyQuota(Long userId) {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        long sent = smsLogRepository.countByUserIdSince(userId, startOfDay);
        return Math.max(0, rateLimitConfig.getMaxPerDay() - (int) sent);
    }

    /**
     * Get SMS usage stats for a user.
     * 
     * @param userId the user ID
     * @return SMS usage statistics
     */
    public SmsUsageStats getUsageStats(Long userId) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);

        long hourlyUsed = smsLogRepository.countByUserIdSince(userId, oneHourAgo);
        long dailyUsed = smsLogRepository.countByUserIdSince(userId, startOfDay);

        return new SmsUsageStats(
            (int) hourlyUsed,
            rateLimitConfig.getMaxPerHour(),
            (int) dailyUsed,
            rateLimitConfig.getMaxPerDay()
        );
    }

    private void checkHourlyLimit(User user) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long sentLastHour = smsLogRepository.countByUserIdSince(user.getId(), oneHourAgo);

        if (sentLastHour >= rateLimitConfig.getMaxPerHour()) {
            log.warn("SMS hourly rate limit exceeded for user: {} (sent: {}, limit: {})",
                user.getUsername(), sentLastHour, rateLimitConfig.getMaxPerHour());
            throw new SmsRateLimitExceededException(rateLimitConfig.getMaxPerHour(), "hour");
        }
    }

    private void checkDailyLimit(User user) {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        long sentToday = smsLogRepository.countByUserIdSince(user.getId(), startOfDay);

        if (sentToday >= rateLimitConfig.getMaxPerDay()) {
            log.warn("SMS daily rate limit exceeded for user: {} (sent: {}, limit: {})",
                user.getUsername(), sentToday, rateLimitConfig.getMaxPerDay());
            throw new SmsRateLimitExceededException(rateLimitConfig.getMaxPerDay(), "day");
        }
    }

    /**
     * Record class for SMS usage statistics.
     */
    public record SmsUsageStats(
        int hourlyUsed,
        int hourlyLimit,
        int dailyUsed,
        int dailyLimit
    ) {
        public int hourlyRemaining() {
            return Math.max(0, hourlyLimit - hourlyUsed);
        }

        public int dailyRemaining() {
            return Math.max(0, dailyLimit - dailyUsed);
        }
    }
}
