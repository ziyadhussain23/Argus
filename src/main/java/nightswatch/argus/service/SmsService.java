package nightswatch.argus.service;

import nightswatch.argus.entity.Alert;
import nightswatch.argus.entity.Notification;
import nightswatch.argus.entity.SmsLog;
import nightswatch.argus.entity.User;

/**
 * Interface for SMS sending service.
 * Allows for different implementations (Twilio, AWS SNS, etc.)
 */
public interface SmsService {

    /**
     * Send an SMS message to a phone number.
     * 
     * @param phoneNumber recipient phone number in E.164 format
     * @param message the message content
     * @param user the user sending the SMS (for logging and rate limiting)
     * @return SmsLog record of the sent message
     */
    SmsLog sendSms(String phoneNumber, String message, User user);

    /**
     * Send an SMS notification for an alert.
     * 
     * @param alert the alert to notify about
     * @param notification the notification record
     * @return SmsLog record of the sent message
     */
    SmsLog sendAlertSms(Alert alert, Notification notification);

    /**
     * Send a test SMS to verify phone configuration.
     * 
     * @param user the user to send test SMS to
     * @return SmsLog record of the sent message
     */
    SmsLog sendTestSms(User user);

    /**
     * Send phone verification OTP.
     * 
     * @param user the user to verify
     * @param otp the OTP code
     * @return SmsLog record of the sent message
     */
    SmsLog sendVerificationSms(User user, String otp);

    /**
     * Check if SMS service is available.
     * 
     * @return true if SMS can be sent
     */
    boolean isAvailable();

    /**
     * Check delivery status of a sent message.
     * 
     * @param messageSid Twilio message SID
     * @return updated SmsLog with current status
     */
    SmsLog checkDeliveryStatus(String messageSid);
}
