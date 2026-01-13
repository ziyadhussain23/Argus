package nightswatch.argus.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nightswatch.argus.dto.request.MetricPayload;
import nightswatch.argus.dto.response.ApiResponse;
import nightswatch.argus.service.MetricService;
import org.springframework.http.ResponseEntity;
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
}
