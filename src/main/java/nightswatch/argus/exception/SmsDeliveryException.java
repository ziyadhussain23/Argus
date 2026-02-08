package nightswatch.argus.exception;

/**
 * Exception thrown when SMS delivery fails.
 */
public class SmsDeliveryException extends RuntimeException {

    private final String errorCode;
    private final String phoneNumber;

    public SmsDeliveryException(String message, String errorCode, String phoneNumber) {
        super(message);
        this.errorCode = errorCode;
        this.phoneNumber = phoneNumber;
    }

    public SmsDeliveryException(String message, String errorCode, String phoneNumber, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.phoneNumber = phoneNumber;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }
}
