package nightswatch.argus.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nightswatch.argus.dto.request.ServerRegistrationRequest;
import nightswatch.argus.dto.response.ApiResponse;
import nightswatch.argus.dto.response.MetricResponse;
import nightswatch.argus.dto.response.ServerResponse;
import nightswatch.argus.entity.Metric;
import nightswatch.argus.entity.Server;
import nightswatch.argus.entity.User;
import nightswatch.argus.repository.ServerRepository;
import nightswatch.argus.service.MetricService;
import nightswatch.argus.service.ServerService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/servers")
@RequiredArgsConstructor
public class ServerController {

    private final ServerService serverService;
    private final MetricService metricService;
    private final ServerRepository serverRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<ServerResponse>> registerServer(
            @Valid @RequestBody ServerRegistrationRequest request,
            @AuthenticationPrincipal User user) {
        
        ServerResponse response = serverService.registerServer(request, user);
        return ResponseEntity.ok(ApiResponse.success("Server registered successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServerResponse>>> getServers(@AuthenticationPrincipal User user) {
        List<ServerResponse> servers = serverService.getServersByOwner(user);
        return ResponseEntity.ok(ApiResponse.success(servers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServerResponse>> getServer(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        
        ServerResponse response = serverService.getServerById(id, user);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteServer(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        
        serverService.deleteServer(id, user);
        return ResponseEntity.ok(ApiResponse.success("Server deleted successfully", null));
    }

    @PostMapping("/{id}/regenerate-key")
    public ResponseEntity<ApiResponse<String>> regenerateAgentKey(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        
        String newKey = serverService.regenerateAgentKey(id, user);
        return ResponseEntity.ok(ApiResponse.success("Agent key regenerated", newKey));
    }

    @GetMapping("/{id}/metrics")
    public ResponseEntity<ApiResponse<List<MetricResponse>>> getServerMetrics(
            @PathVariable Long id,
            @RequestParam(required = false) Metric.MetricType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @AuthenticationPrincipal User user) {
        
        Server server = serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Server not found"));
        
        if (!server.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        // Default to last 24 hours
        if (start == null) start = LocalDateTime.now().minusHours(24);
        if (end == null) end = LocalDateTime.now();
        
        List<MetricResponse> metrics = metricService.getMetricsByServer(server, type, start, end);
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @GetMapping("/{id}/metrics/latest")
    public ResponseEntity<ApiResponse<MetricResponse>> getLatestMetric(
            @PathVariable Long id,
            @RequestParam Metric.MetricType type,
            @AuthenticationPrincipal User user) {
        
        Server server = serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Server not found"));
        
        if (!server.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        MetricResponse metric = metricService.getLatestMetric(server, type);
        return ResponseEntity.ok(ApiResponse.success(metric));
    }
}
