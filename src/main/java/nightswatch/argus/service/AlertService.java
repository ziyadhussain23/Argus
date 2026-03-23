package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.dto.request.AlertRuleRequest;
import nightswatch.argus.dto.request.AlertRuleUpdateRequest;
import nightswatch.argus.dto.response.AlertResponse;
import nightswatch.argus.entity.Alert;
import nightswatch.argus.entity.AlertRule;
import nightswatch.argus.entity.Server;
import nightswatch.argus.entity.User;
import nightswatch.argus.repository.AlertRepository;
import nightswatch.argus.repository.AlertRuleRepository;
import nightswatch.argus.repository.ServerRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final AlertRepository alertRepository;
    private final AlertRuleRepository alertRuleRepository;
    private final ServerRepository serverRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public AlertRule createAlertRule(AlertRuleRequest request, User owner) {
        Server server = serverRepository.findById(request.getServerId())
                .orElseThrow(() -> new RuntimeException("Server not found"));
        
        if (!server.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        AlertRule rule = AlertRule.builder()
                .name(request.getName())
                .description(request.getDescription())
                .server(server)
                .metricType(request.getMetricType())
                .conditionOperator(request.getConditionOperator())
                .thresholdValue(request.getThresholdValue())
                .durationSeconds(request.getDurationSeconds())
                .severity(request.getSeverity())
                .cooldownMinutes(request.getCooldownMinutes() != null ? request.getCooldownMinutes() : 5)
                .isEnabled(true)
                .build();
        
        rule = alertRuleRepository.save(rule);
        log.info("Created alert rule: {} for server: {}", rule.getName(), server.getName());
        
        return rule;
    }

    public List<AlertRule> getAlertRulesByServer(Long serverId, User owner) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new RuntimeException("Server not found"));
        
        if (!server.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        return alertRuleRepository.findByServer(server);
    }

    @Transactional
    public void toggleAlertRule(Long ruleId, boolean enabled, User owner) {
        AlertRule rule = alertRuleRepository.findById(ruleId)
                .orElseThrow(() -> new RuntimeException("Alert rule not found"));
        
        if (!rule.getServer().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        rule.setIsEnabled(enabled);
        alertRuleRepository.save(rule);
        log.info("Alert rule {} {}", rule.getName(), enabled ? "enabled" : "disabled");
    }

    @Transactional
    public void deleteAlertRule(Long ruleId, User owner) {
        AlertRule rule = alertRuleRepository.findById(ruleId)
                .orElseThrow(() -> new RuntimeException("Alert rule not found"));
        
        if (!rule.getServer().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        alertRuleRepository.delete(rule);
        log.info("Deleted alert rule: {}", rule.getName());
    }

    public List<AlertResponse> getAlertsByServer(Long serverId, User owner) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new RuntimeException("Server not found"));
        
        if (!server.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        return alertRepository.findByServerOrderByTriggeredAtDesc(server).stream()
                .map(AlertResponse::fromEntity)
                .toList();
    }

    public List<AlertResponse> getActiveAlerts(User owner) {
        return alertRepository.findByUserId(owner.getId()).stream()
                .filter(a -> a.getStatus() == Alert.AlertStatus.ACTIVE)
                .map(AlertResponse::fromEntity)
                .toList();
    }

    public List<AlertResponse> getResolvedAlerts(User owner) {
        return alertRepository.findByUserIdAndStatus(owner.getId(), Alert.AlertStatus.RESOLVED).stream()
                .map(AlertResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void acknowledgeAlert(Long alertId, User user) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        
        if (!alert.getServer().getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        alert.acknowledge(user);
        alertRepository.save(alert);
        log.info("Alert {} acknowledged by {}", alertId, user.getUsername());

        publishAlertUpdate(alert);
    }

    @Transactional
    public void resolveAlert(Long alertId, User user) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        
        if (!alert.getServer().getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        alert.resolve();
        alertRepository.save(alert);
        log.info("Alert {} resolved by {}", alertId, user.getUsername());

        publishAlertUpdate(alert);
    }

    @Transactional
    public AlertRule updateAlertRule(Long ruleId, AlertRuleUpdateRequest request, User owner) {
        AlertRule rule = alertRuleRepository.findById(ruleId)
                .orElseThrow(() -> new RuntimeException("Alert rule not found"));

        if (!rule.getServer().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Access denied");
        }

        rule.setName(request.getName());
        rule.setDescription(request.getDescription());
        rule.setMetricType(request.getMetricType());
        rule.setConditionOperator(request.getConditionOperator());
        rule.setThresholdValue(request.getThresholdValue());
        rule.setDurationSeconds(request.getDurationSeconds());
        rule.setSeverity(request.getSeverity());
        if (request.getCooldownMinutes() != null) {
            rule.setCooldownMinutes(request.getCooldownMinutes());
        }

        AlertRule updatedRule = alertRuleRepository.save(rule);
        log.info("Updated alert rule: {}", updatedRule.getName());
        return updatedRule;
    }

    private void publishAlertUpdate(Alert alert) {
        AlertResponse payload = AlertResponse.fromEntity(alert);
        messagingTemplate.convertAndSend("/topic/alerts/server/" + alert.getServer().getId(), payload);
        messagingTemplate.convertAndSend("/topic/alerts/user/" + alert.getServer().getOwner().getId(), payload);
    }
}
