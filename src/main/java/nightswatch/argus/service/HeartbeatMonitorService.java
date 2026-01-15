package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.entity.Server;
import nightswatch.argus.repository.ServerRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service to monitor server heartbeats and mark servers as offline
 * if they haven't sent metrics within the threshold period
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HeartbeatMonitorService {

    private final ServerRepository serverRepository;
    private final ServerService serverService;

    // Mark server as offline if no heartbeat for 2 minutes
    private static final int HEARTBEAT_THRESHOLD_SECONDS = 120;

    @Scheduled(fixedRate = 30000) // Check every 30 seconds
    @Transactional
    public void checkServerHeartbeats() {
        LocalDateTime threshold = LocalDateTime.now().minusSeconds(HEARTBEAT_THRESHOLD_SECONDS);
        
        List<Server> staleServers = serverRepository.findServersWithoutRecentHeartbeat(threshold);
        
        for (Server server : staleServers) {
            if (server.getStatus() != Server.ServerStatus.OFFLINE 
                    && server.getStatus() != Server.ServerStatus.UNKNOWN) {
                
                log.warn("Server {} has not sent heartbeat since {}, marking as OFFLINE", 
                        server.getName(), server.getLastHeartbeat());
                
                serverService.updateServerStatus(server, Server.ServerStatus.OFFLINE);
            }
        }
    }
}
