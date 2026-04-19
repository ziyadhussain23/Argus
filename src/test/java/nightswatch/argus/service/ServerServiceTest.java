package nightswatch.argus.service;

import nightswatch.argus.dto.request.ServerRegistrationRequest;
import nightswatch.argus.dto.request.ServerUpdateRequest;
import nightswatch.argus.dto.response.ServerResponse;
import nightswatch.argus.entity.Server;
import nightswatch.argus.entity.User;
import nightswatch.argus.exception.BadRequestException;
import nightswatch.argus.repository.AlertRepository;
import nightswatch.argus.repository.ServerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ServerService} covering Test Cases TC-SM-01 to TC-SM-10
 * defined in Assignment 9. These tests use Mockito only and do not require
 * a running database, Redis, or Spring context.
 */
@ExtendWith(MockitoExtension.class)
class ServerServiceTest {

    @Mock
    private ServerRepository serverRepository;

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ServerService serverService;

    private User owner;
    private User otherUser;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).username("ziyad").email("z@example.com").build();
        otherUser = User.builder().id(2L).username("other").email("o@example.com").build();
    }

    private Server sampleServer(Long id, User u) {
        return Server.builder()
                .id(id)
                .name("web-1")
                .hostAddress("192.168.1.10")
                .agentKey("argus-key-" + id)
                .status(Server.ServerStatus.ONLINE)
                .owner(u)
                .build();
    }

    // ---------- TC-SM-01 ----------
    @Test
    @DisplayName("TC-SM-01: register a new server with valid data succeeds")
    void registerServer_validData_returnsResponse() {
        ServerRegistrationRequest req = ServerRegistrationRequest.builder()
                .name("web-1")
                .hostAddress("192.168.1.10")
                .operatingSystem("Linux")
                .description("primary web")
                .build();

        when(serverRepository.save(any(Server.class))).thenAnswer(inv -> {
            Server s = inv.getArgument(0);
            s.setId(10L);
            return s;
        });

        ServerResponse response = serverService.registerServer(req, owner);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("web-1");
        assertThat(response.getHostAddress()).isEqualTo("192.168.1.10");
        assertThat(response.getAgentKey()).startsWith("argus-");
        verify(serverRepository, times(1)).save(any(Server.class));
    }

    // ---------- TC-SM-05 ----------
    @Test
    @DisplayName("TC-SM-05: list servers returns only the calling user's servers")
    void getServersByOwner_returnsOnlyOwnServers() {
        Server s1 = sampleServer(1L, owner);
        Server s2 = sampleServer(2L, owner);
        when(serverRepository.findByOwner(owner)).thenReturn(List.of(s1, s2));
        when(alertRepository.countActiveAlertsByServerForUser(owner.getId()))
                .thenReturn(Collections.emptyList());

        List<ServerResponse> servers = serverService.getServersByOwner(owner);

        assertThat(servers).hasSize(2);
        assertThat(servers).allSatisfy(r -> assertThat(r.getActiveAlerts()).isEqualTo(0L));
        verify(serverRepository).findByOwner(owner);
    }

    @Test
    @DisplayName("TC-SM-05b: empty list when user has no servers")
    void getServersByOwner_noServers_returnsEmpty() {
        when(serverRepository.findByOwner(owner)).thenReturn(Collections.emptyList());

        List<ServerResponse> servers = serverService.getServersByOwner(owner);

        assertThat(servers).isEmpty();
        verify(alertRepository, never()).countActiveAlertsByServerForUser(anyLong());
    }

    // ---------- TC-SM-06 ----------
    @Test
    @DisplayName("TC-SM-06: view server detail by ID for own server returns server")
    void getServerById_ownServer_returnsResponse() {
        Server s = sampleServer(5L, owner);
        when(serverRepository.findById(5L)).thenReturn(Optional.of(s));
        when(alertRepository.countActiveAlertsByServer(5L)).thenReturn(3L);

        ServerResponse response = serverService.getServerById(5L, owner);

        assertThat(response.getId()).isEqualTo(5L);
        assertThat(response.getActiveAlerts()).isEqualTo(3L);
    }

    // ---------- TC-SM-07 ----------
    @Test
    @DisplayName("TC-SM-07: viewing another user's server is denied")
    void getServerById_otherUserServer_throwsAccessDenied() {
        Server s = sampleServer(7L, owner);
        when(serverRepository.findById(7L)).thenReturn(Optional.of(s));

        assertThatThrownBy(() -> serverService.getServerById(7L, otherUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Access denied");
    }

    // ---------- TC-SM-10 ----------
    @Test
    @DisplayName("TC-SM-10: getServerById on a non-existing ID throws")
    void getServerById_notFound_throws() {
        when(serverRepository.findById(99999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> serverService.getServerById(99999L, owner))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Server not found");
    }

    // ---------- TC-SM-08 ----------
    @Test
    @DisplayName("TC-SM-08: updateServer with new name updates and returns response")
    void updateServer_validNewName_updatesName() {
        Server s = sampleServer(3L, owner);
        when(serverRepository.findById(3L)).thenReturn(Optional.of(s));
        when(alertRepository.countActiveAlertsByServer(3L)).thenReturn(0L);

        ServerUpdateRequest update = ServerUpdateRequest.builder()
                .name("web-1-prod")
                .build();

        ServerResponse response = serverService.updateServer(3L, update, owner);

        assertThat(response.getName()).isEqualTo("web-1-prod");
        assertThat(s.getName()).isEqualTo("web-1-prod");
        verify(serverRepository).save(s);
    }

    @Test
    @DisplayName("TC-SM-08b: updateServer with empty name throws BadRequestException")
    void updateServer_emptyName_throwsBadRequest() {
        Server s = sampleServer(3L, owner);
        when(serverRepository.findById(3L)).thenReturn(Optional.of(s));

        ServerUpdateRequest update = ServerUpdateRequest.builder().name("   ").build();

        assertThatThrownBy(() -> serverService.updateServer(3L, update, owner))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Server name cannot be empty");
    }

    @Test
    @DisplayName("TC-SM-08c: updateServer by non-owner is denied")
    void updateServer_byNonOwner_throwsAccessDenied() {
        Server s = sampleServer(3L, owner);
        when(serverRepository.findById(3L)).thenReturn(Optional.of(s));

        ServerUpdateRequest update = ServerUpdateRequest.builder().name("hacked").build();

        assertThatThrownBy(() -> serverService.updateServer(3L, update, otherUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Access denied");
    }

    // ---------- TC-SM-09 ----------
    @Test
    @DisplayName("TC-SM-09: deleting own server removes it from repository")
    void deleteServer_ownServer_callsDelete() {
        Server s = sampleServer(8L, owner);
        when(serverRepository.findById(8L)).thenReturn(Optional.of(s));

        serverService.deleteServer(8L, owner);

        verify(serverRepository, times(1)).delete(s);
    }

    @Test
    @DisplayName("TC-SM-09b: deleting another user's server is denied")
    void deleteServer_byNonOwner_throws() {
        Server s = sampleServer(8L, owner);
        when(serverRepository.findById(8L)).thenReturn(Optional.of(s));

        assertThatThrownBy(() -> serverService.deleteServer(8L, otherUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Access denied");
        verify(serverRepository, never()).delete(any(Server.class));
    }

    // ---------- TC-SM-10b ----------
    @Test
    @DisplayName("TC-SM-10b: deleting a non-existing server throws")
    void deleteServer_notFound_throws() {
        when(serverRepository.findById(99999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> serverService.deleteServer(99999L, owner))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Server not found");
    }

    // ---------- Bonus: regenerateAgentKey ----------
    @Test
    @DisplayName("Regenerate agent key produces a new argus- prefixed key")
    void regenerateAgentKey_returnsNewKey() {
        Server s = sampleServer(11L, owner);
        String oldKey = s.getAgentKey();
        when(serverRepository.findById(11L)).thenReturn(Optional.of(s));
        when(alertRepository.countActiveAlertsByServer(11L)).thenReturn(0L);

        String newKey = serverService.regenerateAgentKey(11L, owner);

        assertThat(newKey).startsWith("argus-").isNotEqualTo(oldKey);
        assertThat(s.getAgentKey()).isEqualTo(newKey);
    }
}
