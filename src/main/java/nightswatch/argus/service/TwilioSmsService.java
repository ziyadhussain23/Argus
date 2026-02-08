package nightswatch.argus.service;

import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.config.TwilioConfig;
import nightswatch.argus.entity.Alert;
import nightswatch.argus.entity.Notification;
import nightswatch.argus.entity.SmsLog;
import nightswatch.argus.entity.User;
import nightswatch.argus.exception.SmsDeliveryException;
import nightswatch.argus.repository.SmsLogRepository;
import nightswatch.argus.util.PhoneNumberValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Twilio implementation of SmsService.
 * Handles SMS sending via Twilio API.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TwilioSmsService implements SmsService {

    private final TwilioConfig twilioConfig;
    private final SmsLogRepository smsLogRepository;
    private final SmsTemplateService smsTemplateService;
    private final SmsRateLimiter smsRateLimiter;

    @Override
    @Transactional
    public SmsLog sendSms(String phoneNumber, String message, User user) {
        // Validate phone number
        if (!PhoneNumberValidator.isValid(phoneNumber)) {
            throw new SmsDeliveryException(
                PhoneNumberValidator.getValidationError(phoneNumber),
                "INVALID_PHONE",
                phoneNumber
            );
        }

        // Check rate limits
        smsRateLimiter.checkRateLimit(user);

        // Create log entry
        SmsLog smsLog = SmsLog.builder()
                .user(user)
                .phoneNumber(phoneNumber)
                .messageContent(message)
                .status(SmsLog.SmsStatus.PENDING)
                .build();
        smsLog = smsLogRepository.save(smsLog);

        // Check if Twilio is available
        if (!isAvailable()) {
            log.warn("Twilio is not available. SMS not sent to: {}", PhoneNumberValidator.mask(phoneNumber));
            smsLog.markFailed("SERVICE_UNAVAILABLE", "Twilio SMS service is not configured or disabled");
            return smsLogRepository.save(smsLog);
        }

        try {
            // Send via Twilio
            smsLog.setStatus(SmsLog.SmsStatus.SENDING);
            smsLogRepository.save(smsLog);

            Message twilioMessage = Message.creator(
                    new PhoneNumber(phoneNumber),
                    new PhoneNumber(twilioConfig.getPhoneNumber()),
                    message
            ).create();

            // Update log with success
            smsLog.markSent(twilioMessage.getSid());
            smsLog.setSegmentsCount(twilioMessage.getNumSegments() != null ? 
                Integer.parseInt(twilioMessage.getNumSegments()) : 1);
            
            log.info("SMS sent successfully to: {} (SID: {})", 
                PhoneNumberValidator.mask(phoneNumber), twilioMessage.getSid());

            return smsLogRepository.save(smsLog);

        } catch (ApiException e) {
            log.error("Twilio API error sending SMS to {}: {} (Code: {})", 
                PhoneNumberValidator.mask(phoneNumber), e.getMessage(), e.getCode());
            
            smsLog.markFailed(String.valueOf(e.getCode()), e.getMessage());
            smsLogRepository.save(smsLog);
            
            throw new SmsDeliveryException(e.getMessage(), String.valueOf(e.getCode()), phoneNumber, e);

        } catch (Exception e) {
            log.error("Error sending SMS to {}: {}", PhoneNumberValidator.mask(phoneNumber), e.getMessage());
            
            smsLog.markFailed("UNKNOWN_ERROR", e.getMessage());
            smsLogRepository.save(smsLog);
            
            throw new SmsDeliveryException(e.getMessage(), "UNKNOWN_ERROR", phoneNumber, e);
        }
    }

    @Override
    @Transactional
    public SmsLog sendAlertSms(Alert alert, Notification notification) {
        User user = alert.getServer().getOwner();
        String phoneNumber = user.getPhoneNumber();

        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new SmsDeliveryException(
                "User does not have a phone number configured",
                "NO_PHONE_NUMBER",
                null
            );
        }

        String message = smsTemplateService.formatAlertMessage(alert);
        SmsLog smsLog = sendSms(phoneNumber, message, user);
        
        // Link to notification
        smsLog.setNotification(notification);
        return smsLogRepository.save(smsLog);
    }

    @Override
    @Transactional
    public SmsLog sendTestSms(User user) {
        String phoneNumber = user.getPhoneNumber();

        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new SmsDeliveryException(
                "No phone number configured for user",
                "NO_PHONE_NUMBER",
                null
            );
        }

        String message = smsTemplateService.formatTestMessage();
        return sendSms(phoneNumber, message, user);
    }

    @Override
    @Transactional
    public SmsLog sendVerificationSms(User user, String otp) {
        String phoneNumber = user.getPhoneNumber();

        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new SmsDeliveryException(
                "No phone number configured for user",
                "NO_PHONE_NUMBER",
                null
            );
        }

        String message = smsTemplateService.formatVerificationMessage(otp);
        return sendSms(phoneNumber, message, user);
    }

    @Override
    public boolean isAvailable() {
        return twilioConfig.isAvailable();
    }

    @Override
    @Transactional
    public SmsLog checkDeliveryStatus(String messageSid) {
        SmsLog smsLog = smsLogRepository.findByTwilioMessageSid(messageSid)
                .orElse(null);

        if (smsLog == null) {
            log.warn("SMS log not found for message SID: {}", messageSid);
            return null;
        }

        if (!isAvailable()) {
            return smsLog;
        }

        try {
            Message message = Message.fetcher(messageSid).fetch();
            
            String status = message.getStatus().toString();
            switch (status.toUpperCase()) {
                case "DELIVERED" -> smsLog.markDelivered();
                case "FAILED", "UNDELIVERED" -> {
                    smsLog.setStatus(SmsLog.SmsStatus.valueOf(status.toUpperCase()));
                    smsLog.setErrorCode(String.valueOf(message.getErrorCode()));
                    smsLog.setErrorMessage(message.getErrorMessage());
                }
                case "SENT" -> smsLog.setStatus(SmsLog.SmsStatus.SENT);
                case "QUEUED" -> smsLog.setStatus(SmsLog.SmsStatus.QUEUED);
            }

            // Update price info if available
            if (message.getPrice() != null) {
                smsLog.setPrice(Double.parseDouble(message.getPrice()));
                smsLog.setPriceUnit(message.getPriceUnit().toString());
            }

            return smsLogRepository.save(smsLog);

        } catch (Exception e) {
            log.error("Error checking delivery status for {}: {}", messageSid, e.getMessage());
            return smsLog;
        }
    }
}
