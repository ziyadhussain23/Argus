package nightswatch.argus.repository;

import nightswatch.argus.entity.Alert;
import nightswatch.argus.entity.Notification;
import nightswatch.argus.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByRecipient(User recipient);
    
    List<Notification> findByStatus(Notification.NotificationStatus status);
    
    List<Notification> findByAlert(Alert alert);
    
    @Query("SELECT n FROM Notification n WHERE n.status = 'PENDING' ORDER BY n.createdAt")
    List<Notification> findPendingNotifications();
    
    @Query("SELECT n FROM Notification n WHERE n.status = 'FAILED' AND n.retryCount < :maxRetries")
    List<Notification> findFailedNotificationsForRetry(@Param("maxRetries") int maxRetries);

    void deleteByRecipientId(Long recipientId);
}
