package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.dto.request.ServerRegistrationRequest;
import nightswatch.argus.dto.request.ServerUpdateRequest;
import nightswatch.argus.dto.response.ServerResponse;
import nightswatch.argus.entity.Alert;
import nightswatch.argus.entity.AlertRule;
import nightswatch.argus.entity.Server;
import nightswatch.argus.entity.User;
import nightswatch.argus.exception.BadRequestException;
import nightswatch.argus.repository.AlertRepository;
import nightswatch.argus.repository.ServerRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServerService {

    private final ServerRepository serverRepository;
    private final AlertRepository alertRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private record ActiveAlertSnapshot(Server.ServerStatus status, long activeAlerts) {}

    @Transactional
    public ServerResponse registerServer(ServerRegistrationRequest request, User owner) {
        String agentKey = generateAgentKey();
        
        Server server = Server.builder()
                .name(request.getName())
                .hostAddress(request.getHostAddress())
                .operatingSystem(request.getOperatingSystem())
            .description(request.getDescription())
                .agentKey(agentKey)
                .owner(owner)
                .status(Server.ServerStatus.UNKNOWN)
                .build();
        
        server = serverRepository.save(server);
        log.info("Registered new server: {} with agent key: {}", server.getName(), agentKey);
        
        return ServerResponse.fromEntity(server);
    }

    public List<ServerResponse> getServersByOwner(User owner) {
        List<Server> servers = serverRepository.findByOwner(owner);
        if (servers.isEmpty()) {
            return List.of();
        }

        Map<Long, Long> activeAlertsByServerId = alertRepository.countActiveAlertsByServerForUser(owner.getId()).stream()
            .collect(Collectors.toMap(
                AlertRepository.ActiveAlertCountByServer::getServerId,
                AlertRepository.ActiveAlertCountByServer::getCount
            ));

        return servers.stream()
            .map(server -> toResponseWithAlertCount(server, activeAlertsByServerId.getOrDefault(server.getId(), 0L)))
            .toList();
    }

    public List<ServerResponse> getServersByOwnerAndStatus(User owner, Server.ServerStatus status) {
        List<Server> servers = serverRepository.findByOwnerAndStatus(owner, status);
        if (servers.isEmpty()) {
            return List.of();
        }

        Map<Long, Long> activeAlertsByServerId = alertRepository.countActiveAlertsByServerForUser(owner.getId()).stream()
            .collect(Collectors.toMap(
                AlertRepository.ActiveAlertCountByServer::getServerId,
                AlertRepository.ActiveAlertCountByServer::getCount
            ));

        return servers.stream()
            .map(server -> toResponseWithAlertCount(server, activeAlertsByServerId.getOrDefault(server.getId(), 0L)))
            .toList();
    }

    public ServerResponse getServerById(Long id, User owner) {
        Server server = serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Server not found"));
        
        if (!server.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        Long activeAlerts = alertRepository.countActiveAlertsByServer(server.getId());
        return toResponseWithAlertCount(server, activeAlerts != null ? activeAlerts : 0L);
    }

    public Server getServerByAgentKey(String agentKey) {
        return serverRepository.findByAgentKey(agentKey)
                .orElseThrow(() -> new RuntimeException("Invalid agent key"));
    }

    @Transactional
    public void updateHeartbeat(Server server) {
        ActiveAlertSnapshot snapshot = computeActiveAlertSnapshot(server);
        server.setLastHeartbeat(LocalDateTime.now());
        server.setStatus(snapshot.status());
        serverRepository.save(server);
        publishServerUpdate(server, snapshot.activeAlerts());
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

    @Transactional
    public ServerResponse updateServer(Long id, ServerUpdateRequest request, User owner) {
        Server server = serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Server not found"));

        if (!server.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Access denied");
        }

        if (request.getName() != null) {
            String name = request.getName().trim();
            if (name.isEmpty()) {
                throw new BadRequestException("Server name cannot be empty");
            }
            server.setName(name);
        }

        if (request.getHostAddress() != null) {
            String hostAddress = request.getHostAddress().trim();
            if (hostAddress.isEmpty()) {
                throw new BadRequestException("Host address cannot be empty");
            }
            server.setHostAddress(hostAddress);
        }

        if (request.getDescription() != null) {
            server.setDescription(request.getDescription().trim());
        }

        serverRepository.save(server);
        Long activeAlerts = alertRepository.countActiveAlertsByServer(server.getId());
        long activeAlertsCount = activeAlerts != null ? activeAlerts : 0L;
        publishServerUpdate(server, activeAlertsCount);
        return toResponseWithAlertCount(server, activeAlertsCount);
    }

    private String generateAgentKey() {
        return "argus-" + UUID.randomUUID().toString();
    }

    private ServerResponse toResponseWithAlertCount(Server server, Long activeAlerts) {
        ServerResponse response = ServerResponse.fromEntity(server);
        response.setActiveAlerts(activeAlerts != null ? activeAlerts : 0L);
        return response;
    }

    private ActiveAlertSnapshot computeActiveAlertSnapshot(Server server) {
        List<Alert> activeAlerts = alertRepository.findOpenByServer(server);

        boolean hasCritical = activeAlerts.stream().anyMatch(a -> a.getSeverity() == AlertRule.AlertSeverity.CRITICAL);
        boolean hasWarning = activeAlerts.stream().anyMatch(a -> a.getSeverity() == AlertRule.AlertSeverity.WARNING);

        if (hasCritical) {
            return new ActiveAlertSnapshot(Server.ServerStatus.CRITICAL, activeAlerts.size());
        }
        if (hasWarning) {
            return new ActiveAlertSnapshot(Server.ServerStatus.WARNING, activeAlerts.size());
        }
        return new ActiveAlertSnapshot(Server.ServerStatus.ONLINE, activeAlerts.size());
    }

    private void publishServerUpdate(Server server) {
        Long activeAlerts = alertRepository.countActiveAlertsByServer(server.getId());
        publishServerUpdate(server, activeAlerts != null ? activeAlerts : 0L);
    }

    private void publishServerUpdate(Server server, long activeAlerts) {
        ServerResponse payload = toResponseWithAlertCount(server, activeAlerts);
        messagingTemplate.convertAndSend("/topic/servers/" + server.getId(), payload);
        messagingTemplate.convertAndSend("/topic/servers/user/" + server.getOwner().getId(), payload);
    }
}
