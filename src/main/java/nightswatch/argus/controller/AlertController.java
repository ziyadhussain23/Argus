package nightswatch.argus.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nightswatch.argus.dto.request.AlertRuleRequest;
import nightswatch.argus.dto.response.AlertResponse;
import nightswatch.argus.dto.response.AlertRuleResponse;
import nightswatch.argus.dto.response.ApiResponse;
import nightswatch.argus.entity.User;
import nightswatch.argus.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    // ==================== Alert Rules ====================

    @PostMapping("/rules")
    public ResponseEntity<ApiResponse<AlertRuleResponse>> createAlertRule(
            @Valid @RequestBody AlertRuleRequest request,
            @AuthenticationPrincipal User user) {
        
        AlertRuleResponse rule = alertService.createAlertRule(request, user);
        return ResponseEntity.ok(ApiResponse.success("Alert rule created", rule));
    }

    @GetMapping("/rules/server/{serverId}")
    public ResponseEntity<ApiResponse<List<AlertRuleResponse>>> getAlertRules(
            @PathVariable Long serverId,
            @AuthenticationPrincipal User user) {
        
        List<AlertRuleResponse> rules = alertService.getAlertRulesByServer(serverId, user);
        return ResponseEntity.ok(ApiResponse.success(rules));
    }

    @PatchMapping("/rules/{ruleId}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleAlertRule(
            @PathVariable Long ruleId,
            @RequestParam boolean enabled,
            @AuthenticationPrincipal User user) {
        
        alertService.toggleAlertRule(ruleId, enabled, user);
        return ResponseEntity.ok(ApiResponse.success("Alert rule updated", null));
    }

    @DeleteMapping("/rules/{ruleId}")
    public ResponseEntity<ApiResponse<Void>> deleteAlertRule(
            @PathVariable Long ruleId,
            @AuthenticationPrincipal User user) {
        
        alertService.deleteAlertRule(ruleId, user);
        return ResponseEntity.ok(ApiResponse.success("Alert rule deleted", null));
    }

    // ==================== Alerts ====================

    @GetMapping
    public ResponseEntity<ApiResponse<List<AlertResponse>>> getActiveAlerts(
            @AuthenticationPrincipal User user) {
        
        List<AlertResponse> alerts = alertService.getActiveAlerts(user);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @GetMapping("/server/{serverId}")
    public ResponseEntity<ApiResponse<List<AlertResponse>>> getAlertsByServer(
            @PathVariable Long serverId,
            @AuthenticationPrincipal User user) {
        
        List<AlertResponse> alerts = alertService.getAlertsByServer(serverId, user);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @PostMapping("/{alertId}/acknowledge")
    public ResponseEntity<ApiResponse<Void>> acknowledgeAlert(
            @PathVariable Long alertId,
            @AuthenticationPrincipal User user) {
        
        alertService.acknowledgeAlert(alertId, user);
        return ResponseEntity.ok(ApiResponse.success("Alert acknowledged", null));
    }

    @PostMapping("/{alertId}/resolve")
    public ResponseEntity<ApiResponse<Void>> resolveAlert(
            @PathVariable Long alertId,
            @AuthenticationPrincipal User user) {
        
        alertService.resolveAlert(alertId, user);
        return ResponseEntity.ok(ApiResponse.success("Alert resolved", null));
    }
}
