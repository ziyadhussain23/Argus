package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.dto.response.AlertResponse;
import nightswatch.argus.entity.*;
import nightswatch.argus.repository.AlertRepository;
import nightswatch.argus.repository.AlertRuleRepository;
import nightswatch.argus.repository.MetricRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertEvaluationService {

    private final AlertRuleRepository alertRuleRepository;
    private final AlertRepository alertRepository;
    private final MetricRepository metricRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ServerService serverService;

    @Transactional
    public void evaluateMetrics(Server server, List<Metric> metrics) {
        if (metrics == null || metrics.isEmpty()) {
            return;
        }

        List<Metric.MetricType> metricTypes = metrics.stream()
                .map(Metric::getMetricType)
                .distinct()
                .toList();

        if (metricTypes.isEmpty()) {
            return;
        }

        List<AlertRule> enabledRules = alertRuleRepository.findEnabledByServerAndMetricTypes(server, metricTypes);
        if (enabledRules.isEmpty()) {
            return;
        }

        Map<Metric.MetricType, List<AlertRule>> rulesByType = enabledRules.stream()
                .collect(Collectors.groupingBy(AlertRule::getMetricType));

        for (Metric metric : metrics) {
            List<AlertRule> rules = rulesByType.get(metric.getMetricType());
            if (rules == null || rules.isEmpty()) {
                continue;
            }
            for (AlertRule rule : rules) {
                evaluateRule(rule, metric);
            }
        }
    }

    private void evaluateRule(AlertRule rule, Metric metric) {
        boolean conditionMet = rule.evaluate(metric.getValue());
        
        if (conditionMet) {
            // Check for duration condition if specified
            if (rule.getDurationSeconds() != null && rule.getDurationSeconds() > 0) {
                if (!isDurationConditionMet(rule, metric)) {
                    return; // Duration not met yet
                }
            }
            
            // If there is already an open alert for this rule (ACTIVE or ACKNOWLEDGED),
            // update it instead of creating duplicates.
            Optional<Alert> existingOpenAlert = alertRepository.findLatestOpenByRule(rule);
            if (existingOpenAlert.isPresent()) {
                updateOpenAlert(existingOpenAlert.get(), rule, metric);
                return;
            }

            // Check cooldown to avoid alert spam (only applies when creating a new alert)
            if (isInCooldown(rule)) {
                log.debug("Rule {} is in cooldown, skipping alert", rule.getName());
                return;
            }

            triggerAlert(rule, metric);
        } else {
            // Auto-resolve if condition is no longer met
            autoResolveAlert(rule);
        }
    }

    private void updateOpenAlert(Alert alert, AlertRule rule, Metric metric) {
        String title = buildAlertTitle(rule);
        String message = buildAlertMessage(rule, metric);

        alert.setTitle(title);
        alert.setMessage(message);
        alert.setMetricValue(metric.getValue());
        alert.setThresholdValue(rule.getThresholdValue());

        Alert saved = alertRepository.save(alert);

        updateServerStatus(rule.getServer(), rule.getSeverity());
        publishAlertUpdate(saved);
    }

    private boolean isDurationConditionMet(AlertRule rule, Metric currentMetric) {
        LocalDateTime since = LocalDateTime.now().minusSeconds(rule.getDurationSeconds());
        Double avgValue = metricRepository.getAverageValue(
                rule.getServer(), 
                rule.getMetricType(), 
                since
        );
        
        return avgValue != null && rule.evaluate(avgValue);
    }

    private boolean isInCooldown(AlertRule rule) {
        if (rule.getCooldownMinutes() == null || rule.getCooldownMinutes() <= 0) {
            return false;
        }
        
        LocalDateTime cooldownThreshold = LocalDateTime.now().minusMinutes(rule.getCooldownMinutes());
        Optional<Alert> recentAlert = alertRepository.findRecentByRule(rule, cooldownThreshold);
        
        return recentAlert.isPresent();
    }

    @Transactional
    public void triggerAlert(AlertRule rule, Metric metric) {
        String title = buildAlertTitle(rule);
        String message = buildAlertMessage(rule, metric);
        
        Alert alert = Alert.builder()
                .server(rule.getServer())
                .alertRule(rule)
                .title(title)
                .message(message)
                .severity(rule.getSeverity())
                .status(Alert.AlertStatus.ACTIVE)
                .metricValue(metric.getValue())
                .thresholdValue(rule.getThresholdValue())
                .triggeredAt(LocalDateTime.now())
                .build();
        
        alert = alertRepository.save(alert);
        log.warn("Alert triggered: {} - {} = {}", rule.getName(), rule.getMetricType(), metric.getValue());
        
        // Update server status based on severity
        updateServerStatus(rule.getServer(), rule.getSeverity());
        
        // Send notification after transaction commits so the async thread can read the alert
        Long alertId = alert.getId();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                notificationService.sendAlertNotification(alertId);
            }
        });

        publishAlertUpdate(alert);
    }

    private void autoResolveAlert(AlertRule rule) {
        Optional<Alert> activeAlert = alertRepository.findLatestOpenByRule(rule);
        
        if (activeAlert.isPresent()) {
            Alert alert = activeAlert.get();
            alert.resolve();
            alertRepository.save(alert);
            log.info("Auto-resolved alert: {}", alert.getTitle());

            updateServerStatusAfterAlertChange(alert.getServer());
            publishAlertUpdate(alert);
        }
    }

    private void updateServerStatus(Server server, AlertRule.AlertSeverity severity) {
        Server.ServerStatus newStatus = switch (severity) {
            case CRITICAL -> Server.ServerStatus.CRITICAL;
            case WARNING -> Server.ServerStatus.WARNING;
            case INFO -> server.getStatus(); // Don't change for INFO
        };
        
        if (newStatus != server.getStatus()) {
            serverService.updateServerStatus(server, newStatus);
        }
    }

    private void updateServerStatusAfterAlertChange(Server server) {
        if (server.getStatus() == Server.ServerStatus.OFFLINE) {
            return;
        }

        List<Alert> activeAlerts = alertRepository.findOpenByServer(server);
        boolean hasCritical = activeAlerts.stream().anyMatch(a -> a.getSeverity() == AlertRule.AlertSeverity.CRITICAL);
        boolean hasWarning = activeAlerts.stream().anyMatch(a -> a.getSeverity() == AlertRule.AlertSeverity.WARNING);

        Server.ServerStatus status = hasCritical
                ? Server.ServerStatus.CRITICAL
                : hasWarning ? Server.ServerStatus.WARNING : Server.ServerStatus.ONLINE;

        if (server.getStatus() != status) {
            serverService.updateServerStatus(server, status);
        }
    }

    private void publishAlertUpdate(Alert alert) {
        AlertResponse payload = AlertResponse.fromEntity(alert);
        messagingTemplate.convertAndSend("/topic/alerts/server/" + alert.getServer().getId(), payload);
        messagingTemplate.convertAndSend("/topic/alerts/user/" + alert.getServer().getOwner().getId(), payload);
    }

    private String buildAlertTitle(AlertRule rule) {
        return String.format("[%s] %s on %s",
                rule.getSeverity(),
                rule.getName(),
                rule.getServer().getName());
    }

    private String buildAlertMessage(AlertRule rule, Metric metric) {
        return String.format(
                "Alert triggered: %s\n" +
                        "Server: %s (%s)\n" +
                        "Metric: %s\n" +
                        "Current Value: %.2f %s\n" +
                        "Threshold: %s %.2f",
                rule.getName(),
                rule.getServer().getName(),
                rule.getServer().getHostAddress(),
                rule.getMetricType(),
                metric.getValue(),
                metric.getUnit() != null ? metric.getUnit() : "",
                rule.getConditionOperator(),
                rule.getThresholdValue()
        );
    }
}
