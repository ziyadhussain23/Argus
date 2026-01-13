package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.entity.*;
import nightswatch.argus.repository.AlertRepository;
import nightswatch.argus.repository.AlertRuleRepository;
import nightswatch.argus.repository.MetricRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertEvaluationService {

    private final AlertRuleRepository alertRuleRepository;
    private final AlertRepository alertRepository;
    private final MetricRepository metricRepository;
    private final NotificationService notificationService;

    @Transactional
    public void evaluateMetrics(Server server, List<Metric> metrics) {
        for (Metric metric : metrics) {
            List<AlertRule> rules = alertRuleRepository.findByServerAndMetricType(server, metric.getMetricType());
            
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
            
            // Check cooldown to avoid alert spam
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
        String title = String.format("[%s] %s on %s", 
                rule.getSeverity(), 
                rule.getName(), 
                rule.getServer().getName());
        
        String message = String.format(
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
        
        // Send notification
        notificationService.sendAlertNotification(alert);
    }

    private void autoResolveAlert(AlertRule rule) {
        Optional<Alert> activeAlert = alertRepository.findLatestActiveByRule(rule);
        
        if (activeAlert.isPresent()) {
            Alert alert = activeAlert.get();
            alert.resolve();
            alertRepository.save(alert);
            log.info("Auto-resolved alert: {}", alert.getTitle());
        }
    }

    private void updateServerStatus(Server server, AlertRule.AlertSeverity severity) {
        Server.ServerStatus newStatus = switch (severity) {
            case CRITICAL -> Server.ServerStatus.CRITICAL;
            case WARNING -> Server.ServerStatus.WARNING;
            case INFO -> server.getStatus(); // Don't change for INFO
        };
        
        if (newStatus != server.getStatus()) {
            server.setStatus(newStatus);
        }
    }
}
