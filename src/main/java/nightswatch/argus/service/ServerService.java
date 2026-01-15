package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.dto.request.ServerRegistrationRequest;
import nightswatch.argus.dto.response.ServerResponse;
import nightswatch.argus.entity.Alert;
import nightswatch.argus.entity.AlertRule;
import nightswatch.argus.entity.Server;
import nightswatch.argus.entity.User;
import nightswatch.argus.repository.AlertRepository;
import nightswatch.argus.repository.ServerRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServerService {

    private final ServerRepository serverRepository;
    private final AlertRepository alertRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ServerResponse registerServer(ServerRegistrationRequest request, User owner) {
        String agentKey = generateAgentKey();
        
        Server server = Server.builder()
                .name(request.getName())
                .hostAddress(request.getHostAddress())
                .operatingSystem(request.getOperatingSystem())
                .agentKey(agentKey)
                .owner(owner)
                .status(Server.ServerStatus.UNKNOWN)
                .build();
        
        server = serverRepository.save(server);
        log.info("Registered new server: {} with agent key: {}", server.getName(), agentKey);
        
        return ServerResponse.fromEntity(server);
    }

    public List<ServerResponse> getServersByOwner(User owner) {
        return serverRepository.findByOwner(owner).stream()
                .map(this::toResponseWithAlertCount)
                .toList();
    }

    public ServerResponse getServerById(Long id, User owner) {
        Server server = serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Server not found"));
        
        if (!server.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        return toResponseWithAlertCount(server);
    }

    public Server getServerByAgentKey(String agentKey) {
        return serverRepository.findByAgentKey(agentKey)
                .orElseThrow(() -> new RuntimeException("Invalid agent key"));
    }

    @Transactional
    public void updateHeartbeat(Server server) {
        server.setLastHeartbeat(LocalDateTime.now());
        server.setStatus(resolveStatusFromActiveAlerts(server));
        serverRepository.save(server);
        publishServerUpdate(server);
    }

    @Transactional
    public void updateServerStatus(Server server, Server.ServerStatus status) {
        server.setStatus(status);
        serverRepository.save(server);
        publishServerUpdate(server);
    }

    @Transactional
    public void deleteServer(Long id, User owner) {
        Server server = serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Server not found"));
        
        if (!server.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        serverRepository.delete(server);
        log.info("Deleted server: {}", server.getName());
    }

    public String regenerateAgentKey(Long serverId, User owner) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new RuntimeException("Server not found"));
        
        if (!server.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        String newKey = generateAgentKey();
        server.setAgentKey(newKey);
        serverRepository.save(server);
        publishServerUpdate(server);
        
        log.info("Regenerated agent key for server: {}", server.getName());
        return newKey;
    }

    private String generateAgentKey() {
        return "argus-" + UUID.randomUUID().toString();
    }

    private ServerResponse toResponseWithAlertCount(Server server) {
        ServerResponse response = ServerResponse.fromEntity(server);
        Long activeAlerts = alertRepository.countActiveAlertsByUser(server.getOwner().getId());
        response.setActiveAlerts(activeAlerts);
        return response;
    }

    private Server.ServerStatus resolveStatusFromActiveAlerts(Server server) {
        List<Alert> activeAlerts = alertRepository.findByServerAndStatus(server, Alert.AlertStatus.ACTIVE);

        boolean hasCritical = activeAlerts.stream().anyMatch(a -> a.getSeverity() == AlertRule.AlertSeverity.CRITICAL);
        boolean hasWarning = activeAlerts.stream().anyMatch(a -> a.getSeverity() == AlertRule.AlertSeverity.WARNING);

        if (hasCritical) {
            return Server.ServerStatus.CRITICAL;
        }
        if (hasWarning) {
            return Server.ServerStatus.WARNING;
        }
        return Server.ServerStatus.ONLINE;
    }

    private void publishServerUpdate(Server server) {
        ServerResponse payload = toResponseWithAlertCount(server);
        messagingTemplate.convertAndSend("/topic/servers/" + server.getId(), payload);
        messagingTemplate.convertAndSend("/topic/servers/user/" + server.getOwner().getId(), payload);
    }
}
