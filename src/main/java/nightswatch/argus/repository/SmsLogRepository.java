package nightswatch.argus.repository;

import nightswatch.argus.entity.SmsLog;
import nightswatch.argus.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for SmsLog entity.
 * Includes methods for rate limiting and analytics.
 */
@Repository
public interface SmsLogRepository extends JpaRepository<SmsLog, Long> {

    /**
     * Find SMS logs by user.
     */
    List<SmsLog> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Find SMS log by Twilio message SID.
     */
    Optional<SmsLog> findByTwilioMessageSid(String twilioMessageSid);

    /**
     * Count SMS sent to a user within a time period (for rate limiting).
     */
    @Query("SELECT COUNT(s) FROM SmsLog s WHERE s.user = :user AND s.createdAt >= :since AND s.status NOT IN ('FAILED')")
    long countByUserSince(@Param("user") User user, @Param("since") LocalDateTime since);

    /**
     * Count SMS sent in the last hour for rate limiting.
     */
    @Query("SELECT COUNT(s) FROM SmsLog s WHERE s.user.id = :userId AND s.createdAt >= :since AND s.status NOT IN ('FAILED')")
    long countByUserIdSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    /**
     * Find failed SMS logs for potential retry.
     */
    @Query("SELECT s FROM SmsLog s WHERE s.status = 'FAILED' AND s.createdAt >= :since")
    List<SmsLog> findRecentFailed(@Param("since") LocalDateTime since);

    /**
     * Find pending SMS logs for processing.
     */
    List<SmsLog> findByStatus(SmsLog.SmsStatus status);

    /**
     * Get total SMS count for a user in a date range.
     */
    @Query("SELECT COUNT(s) FROM SmsLog s WHERE s.user.id = :userId AND s.createdAt BETWEEN :start AND :end")
    long countByUserIdBetween(
        @Param("userId") Long userId, 
        @Param("start") LocalDateTime start, 
        @Param("end") LocalDateTime end
    );

    /**
     * Get SMS cost sum for a user in a date range.
     */
    @Query("SELECT COALESCE(SUM(s.price), 0) FROM SmsLog s WHERE s.user.id = :userId AND s.createdAt BETWEEN :start AND :end AND s.status = 'DELIVERED'")
    Double sumCostByUserIdBetween(
        @Param("userId") Long userId, 
        @Param("start") LocalDateTime start, 
        @Param("end") LocalDateTime end
    );

    void deleteByUserId(Long userId);
}
