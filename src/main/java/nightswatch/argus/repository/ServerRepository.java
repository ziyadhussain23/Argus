package nightswatch.argus.repository;

import nightswatch.argus.entity.Server;
import nightswatch.argus.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServerRepository extends JpaRepository<Server, Long> {
    
    List<Server> findByOwner(User owner);

    List<Server> findByOwnerAndStatus(User owner, Server.ServerStatus status);
    
    Optional<Server> findByAgentKey(String agentKey);
    
    boolean existsByAgentKey(String agentKey);
    
    @Query("SELECT s FROM Server s WHERE s.status = :status")
    List<Server> findByStatus(@Param("status") Server.ServerStatus status);
    
    @Query("SELECT s FROM Server s WHERE s.lastHeartbeat < :threshold")
    List<Server> findServersWithoutRecentHeartbeat(@Param("threshold") LocalDateTime threshold);
    
    @Query("SELECT s FROM Server s WHERE s.owner.id = :ownerId")
    List<Server> findByOwnerId(@Param("ownerId") Long ownerId);
}
