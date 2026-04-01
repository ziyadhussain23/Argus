package nightswatch.argus.dto.response;

import lombok.*;
import nightswatch.argus.entity.Server;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServerResponse {

    private Long id;
    private String name;
    private String hostAddress;
    private String agentKey;
    private String operatingSystem;
    private String description;
    private Server.ServerStatus status;
    private LocalDateTime lastHeartbeat;
    private LocalDateTime createdAt;
    private Long activeAlerts;

    public static ServerResponse fromEntity(Server server) {
        return ServerResponse.builder()
                .id(server.getId())
                .name(server.getName())
                .hostAddress(server.getHostAddress())
                .agentKey(server.getAgentKey())
                .operatingSystem(server.getOperatingSystem())
                .description(server.getDescription())
                .status(server.getStatus())
                .lastHeartbeat(server.getLastHeartbeat())
                .createdAt(server.getCreatedAt())
                .build();
    }
}
