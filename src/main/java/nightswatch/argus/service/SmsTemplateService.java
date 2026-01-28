package nightswatch.argus.service;

import nightswatch.argus.entity.Alert;
import nightswatch.argus.entity.AlertRule;
import nightswatch.argus.entity.Metric;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

/**
 * Service for generating SMS message content from alert data.
 * SMS messages are limited to 160 characters for single segment.
 */
@Service
public class SmsTemplateService {

    private static final int SMS_MAX_LENGTH = 160;
    private static final int SMS_EXTENDED_LENGTH = 320; // 2 segments
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    /**
     * Generate SMS message for an alert.
     * Keeps message concise to fit in 1-2 SMS segments.
     * 
     * @param alert the alert to format
     * @return formatted SMS message
     */
    public String formatAlertMessage(Alert alert) {
        String severity = getSeverityIcon(alert.getSeverity());
        String serverName = truncate(alert.getServer().getName(), 15);
        String metricType = formatMetricType(alert.getAlertRule().getMetricType());
        String value = formatValue(alert.getMetricValue(), alert.getAlertRule().getMetricType());
        String threshold = formatValue(alert.getThresholdValue(), alert.getAlertRule().getMetricType());
        String time = alert.getTriggeredAt().format(TIME_FORMATTER);

        // Format: 🔴 CRITICAL: server-name
        // CPU: 95% > 80%
        // [14:30] Argus Alert
        String message = String.format(
            "%s %s: %s\n%s: %s > %s\n[%s] Argus Alert",
            severity,
            alert.getSeverity(),
            serverName,
            metricType,
            value,
            threshold,
            time
        );

        return truncate(message, SMS_EXTENDED_LENGTH);
    }

    /**
     * Generate a short alert message for SMS (single segment).
     * 
     * @param alert the alert to format
     * @return short SMS message
     */
    public String formatShortAlertMessage(Alert alert) {
        String severity = getSeverityIcon(alert.getSeverity());
        String serverName = truncate(alert.getServer().getName(), 12);
        String metricType = formatMetricTypeShort(alert.getAlertRule().getMetricType());
        String value = formatValue(alert.getMetricValue(), alert.getAlertRule().getMetricType());

        String message = String.format(
            "%s %s %s: %s at %s",
            severity,
            alert.getSeverity().toString().substring(0, 4),
            serverName,
            metricType,
            value
        );

        return truncate(message, SMS_MAX_LENGTH);
    }

    /**
     * Generate server down notification message.
     * 
     * @param serverName name of the server
     * @param lastSeen last seen timestamp
     * @return formatted SMS message
     */
    public String formatServerDownMessage(String serverName, String lastSeen) {
        return truncate(
            String.format("🔴 SERVER DOWN: %s\nLast seen: %s\n- Argus Alert", serverName, lastSeen),
            SMS_EXTENDED_LENGTH
        );
    }

    /**
     * Generate server recovery notification message.
     * 
     * @param serverName name of the server
     * @return formatted SMS message
     */
    public String formatServerRecoveryMessage(String serverName) {
        return truncate(
            String.format("✅ SERVER UP: %s is back online\n- Argus Alert", serverName),
            SMS_MAX_LENGTH
        );
    }

    /**
     * Generate alert resolution message.
     * 
     * @param alert the resolved alert
     * @return formatted SMS message
     */
    public String formatAlertResolvedMessage(Alert alert) {
        String serverName = truncate(alert.getServer().getName(), 15);
        String metricType = formatMetricType(alert.getAlertRule().getMetricType());

        return truncate(
            String.format("✅ RESOLVED: %s\n%s returned to normal\n- Argus", serverName, metricType),
            SMS_MAX_LENGTH
        );
    }

    /**
     * Generate phone verification OTP message.
     * 
     * @param otp the OTP code
     * @return formatted SMS message
     */
    public String formatVerificationMessage(String otp) {
        return String.format("Your Argus verification code is: %s\nValid for 10 minutes.", otp);
    }

    /**
     * Generate test SMS message.
     * 
     * @return test message
     */
    public String formatTestMessage() {
        return "✅ Argus SMS test successful!\nYour phone is configured correctly for alerts.";
    }

    private String getSeverityIcon(AlertRule.AlertSeverity severity) {
        return switch (severity) {
            case CRITICAL -> "🔴";
            case WARNING -> "⚠️";
            case INFO -> "ℹ️";
        };
    }

    private String formatMetricType(Metric.MetricType type) {
        return switch (type) {
            case CPU_USAGE -> "CPU";
            case MEMORY_USAGE -> "Memory";
            case DISK_USAGE -> "Disk";
            case LOAD_AVERAGE -> "Load";
            case PROCESS_COUNT -> "Processes";
            case UPTIME -> "Uptime";
            default -> type.toString().replace("_", " ");
        };
    }

    private String formatMetricTypeShort(Metric.MetricType type) {
        return switch (type) {
            case CPU_USAGE -> "CPU";
            case MEMORY_USAGE -> "MEM";
            case DISK_USAGE -> "DSK";
            case LOAD_AVERAGE -> "LOAD";
            case PROCESS_COUNT -> "PROC";
            default -> type.toString().substring(0, Math.min(4, type.toString().length()));
        };
    }

    private String formatValue(Double value, Metric.MetricType type) {
        if (value == null) return "N/A";
        return switch (type) {
            case CPU_USAGE, MEMORY_USAGE, DISK_USAGE -> String.format("%.0f%%", value);
            case LOAD_AVERAGE -> String.format("%.1f", value);
            default -> String.format("%.0f", value);
        };
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "...";
    }
}
