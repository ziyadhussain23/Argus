package nightswatch.argus.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.entity.SmsLog;
import nightswatch.argus.repository.SmsLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Webhook controller for receiving Twilio SMS status callbacks.
 * Configure in Twilio: https://yourdomain.com/api/v1/webhooks/sms/status
 */
@RestController
@RequestMapping("/api/v1/webhooks/sms")
@RequiredArgsConstructor
@Slf4j
public class SmsWebhookController {

    private final SmsLogRepository smsLogRepository;

    /**
     * Receive SMS delivery status updates from Twilio.
     * 
     * Twilio sends POST requests with form data containing:
     * - MessageSid: The unique identifier for the message
     * - MessageStatus: Current status (queued, sending, sent, delivered, undelivered, failed)
     * - ErrorCode: Error code if failed (optional)
     * - ErrorMessage: Error message if failed (optional)
     */
    @PostMapping("/status")
    public ResponseEntity<String> handleStatusCallback(@RequestParam Map<String, String> params) {
        String messageSid = params.get("MessageSid");
        String messageStatus = params.get("MessageStatus");
        String errorCode = params.get("ErrorCode");
        String errorMessage = params.get("ErrorMessage");

        log.info("Received SMS status callback - SID: {}, Status: {}", messageSid, messageStatus);

        if (messageSid == null || messageSid.isBlank()) {
            log.warn("Received callback without MessageSid");
            return ResponseEntity.badRequest().body("Missing MessageSid");
        }

        // Find and update the SMS log
        smsLogRepository.findByTwilioMessageSid(messageSid).ifPresentOrElse(
            smsLog -> updateSmsLogStatus(smsLog, messageStatus, errorCode, errorMessage),
            () -> log.warn("SMS log not found for SID: {}", messageSid)
        );

        // Twilio expects a 200 OK response
        return ResponseEntity.ok("OK");
    }

    /**
     * Receive inbound SMS messages (for future reply handling).
     */
    @PostMapping("/inbound")
    public ResponseEntity<String> handleInboundSms(@RequestParam Map<String, String> params) {
        String from = params.get("From");
        String body = params.get("Body");

        log.info("Received inbound SMS from: {} - Body: {}", from, body);

        // For now, just log inbound messages
        // Future: Could implement reply handling (e.g., "STOP" to unsubscribe)
        
        if (body != null && body.trim().equalsIgnoreCase("STOP")) {
            log.info("Received STOP request from: {}", from);
            // Could implement opt-out logic here
        }

        // Return TwiML response (empty response = no reply)
        return ResponseEntity.ok("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>");
    }

    private void updateSmsLogStatus(SmsLog smsLog, String status, String errorCode, String errorMessage) {
        if (status == null) {
            return;
        }

        try {
            switch (status.toLowerCase()) {
                case "delivered" -> {
                    smsLog.markDelivered();
                    log.info("SMS marked as delivered: {}", smsLog.getId());
                }
                case "failed" -> {
                    smsLog.markFailed(errorCode, errorMessage);
                    log.warn("SMS delivery failed: {} - Error: {} - {}", 
                        smsLog.getId(), errorCode, errorMessage);
                }
                case "undelivered" -> {
                    smsLog.setStatus(SmsLog.SmsStatus.UNDELIVERED);
                    smsLog.setErrorCode(errorCode);
                    smsLog.setErrorMessage(errorMessage);
                    log.warn("SMS undelivered: {} - Error: {} - {}", 
                        smsLog.getId(), errorCode, errorMessage);
                }
                case "sent" -> {
                    if (smsLog.getStatus() != SmsLog.SmsStatus.DELIVERED) {
                        smsLog.setStatus(SmsLog.SmsStatus.SENT);
                    }
                }
                case "queued" -> smsLog.setStatus(SmsLog.SmsStatus.QUEUED);
                case "sending" -> smsLog.setStatus(SmsLog.SmsStatus.SENDING);
                default -> log.debug("Unknown SMS status: {}", status);
            }

            smsLogRepository.save(smsLog);
        } catch (Exception e) {
            log.error("Error updating SMS log status: {}", e.getMessage());
        }
    }
}
