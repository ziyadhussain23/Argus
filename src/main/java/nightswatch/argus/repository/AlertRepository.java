package nightswatch.argus.repository;

import nightswatch.argus.entity.Alert;
import nightswatch.argus.entity.AlertRule;
import nightswatch.argus.entity.Server;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    
    List<Alert> findByServerOrderByTriggeredAtDesc(Server server);
    
    List<Alert> findByStatus(Alert.AlertStatus status);
    
    @Query("SELECT a FROM Alert a WHERE a.server = :server AND a.status = :status ORDER BY a.triggeredAt DESC")
    List<Alert> findByServerAndStatus(@Param("server") Server server, @Param("status") Alert.AlertStatus status);
    
    @Query("SELECT a FROM Alert a WHERE a.alertRule = :rule AND a.status = 'ACTIVE' ORDER BY a.triggeredAt DESC LIMIT 1")
    Optional<Alert> findLatestActiveByRule(@Param("rule") AlertRule rule);
    
    @Query("SELECT a FROM Alert a WHERE a.alertRule = :rule AND a.triggeredAt > :since ORDER BY a.triggeredAt DESC LIMIT 1")
    Optional<Alert> findRecentByRule(@Param("rule") AlertRule rule, @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.server.owner.id = :userId AND a.status = 'ACTIVE'")
    Long countActiveAlertsByUser(@Param("userId") Long userId);
    
    @Query("SELECT a FROM Alert a WHERE a.server.owner.id = :userId ORDER BY a.triggeredAt DESC")
    List<Alert> findByUserId(@Param("userId") Long userId);
}
