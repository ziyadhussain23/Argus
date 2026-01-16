package nightswatch.argus.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nightswatch.argus.dto.request.MetricPayload;
import nightswatch.argus.dto.response.ApiResponse;
import nightswatch.argus.dto.response.MetricResponse;
import nightswatch.argus.entity.Metric;
import nightswatch.argus.entity.Server;
import nightswatch.argus.entity.User;
import nightswatch.argus.repository.ServerRepository;
import nightswatch.argus.service.MetricService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Metric Ingestion Controller
 * 
 * This is the endpoint that agents running on client servers will call
 * to send their collected metrics to the Argus server.
 */
@RestController
@RequestMapping("/api/v1/metrics")
@RequiredArgsConstructor
public class MetricIngestionController {

    private final MetricService metricService;
    private final ServerRepository serverRepository;

    /**
     * Endpoint for agents to push metrics
     * Agents authenticate using their agentKey in the payload
     */
    @PostMapping("/ingest")
    public ResponseEntity<ApiResponse<String>> ingestMetrics(@Valid @RequestBody MetricPayload payload) {
        try {
            metricService.ingestMetrics(payload);
            return ResponseEntity.ok(ApiResponse.success("Metrics ingested successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/server/{id}")
    public ResponseEntity<ApiResponse<java.util.List<MetricResponse>>> getServerMetrics(
            @PathVariable Long id,
            @RequestParam(required = false) Metric.MetricType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime end,
            @AuthenticationPrincipal User user) {

        Server server = requireOwnedServer(id, user);

        if (start == null) start = java.time.LocalDateTime.now().minusHours(24);
        if (end == null) end = java.time.LocalDateTime.now();

        java.util.List<MetricResponse> metrics = metricService.getMetricsByServer(server, type, start, end);
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @GetMapping("/server/{id}/latest")
    public ResponseEntity<ApiResponse<MetricResponse>> getLatestMetric(
            @PathVariable Long id,
            @RequestParam Metric.MetricType type,
            @AuthenticationPrincipal User user) {

        Server server = requireOwnedServer(id, user);
        MetricResponse metric = metricService.getLatestMetric(server, type);
        return ResponseEntity.ok(ApiResponse.success(metric));
    }

    @GetMapping("/server/{id}/average")
    public ResponseEntity<ApiResponse<Double>> getAverageMetric(
            @PathVariable Long id,
            @RequestParam Metric.MetricType type,
            @RequestParam(defaultValue = "60") int minutes,
            @AuthenticationPrincipal User user) {

        Server server = requireOwnedServer(id, user);
        Double average = metricService.getAverageMetric(server, type, minutes);
        return ResponseEntity.ok(ApiResponse.success(average));
    }

    /**
     * Heartbeat endpoint - agents can call this to indicate they're alive
     * without sending full metrics
     */
    @PostMapping("/heartbeat")
    public ResponseEntity<ApiResponse<String>> heartbeat(@RequestParam String agentKey) {
        try {
            // Create minimal payload for heartbeat
            MetricPayload payload = MetricPayload.builder()
                    .agentKey(agentKey)
                    .metrics(java.util.Collections.emptyList())
                    .build();
            metricService.ingestMetrics(payload);
            return ResponseEntity.ok(ApiResponse.success("Heartbeat received", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private Server requireOwnedServer(Long id, User user) {
        Server server = serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Server not found"));

        if (!server.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        return server;
    }
}
