package nightswatch.argus.config;

import com.twilio.Twilio;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for Twilio SMS service.
 * Initializes Twilio client with account credentials.
 */
@Configuration
@Getter
@Slf4j
public class TwilioConfig {

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.phone-number:}")
    private String phoneNumber;

    @Value("${twilio.enabled:false}")
    private boolean enabled;

    @PostConstruct
    public void initTwilio() {
        if (enabled && isConfigured()) {
            try {
                Twilio.init(accountSid, authToken);
                log.info("Twilio SMS service initialized successfully");
            } catch (Exception e) {
                log.error("Failed to initialize Twilio: {}", e.getMessage());
            }
        } else if (enabled) {
            log.warn("Twilio is enabled but not properly configured. SMS notifications will be disabled.");
        } else {
            log.info("Twilio SMS service is disabled");
        }
    }

    /**
     * Check if Twilio is properly configured with all required credentials.
     */
    public boolean isConfigured() {
        return accountSid != null && !accountSid.isBlank() 
                && !accountSid.equals("your-account-sid")
                && authToken != null && !authToken.isBlank()
                && !authToken.equals("your-auth-token")
                && phoneNumber != null && !phoneNumber.isBlank()
                && !phoneNumber.equals("+1234567890");
    }

    /**
     * Check if SMS service is available (enabled and configured).
     */
    public boolean isAvailable() {
        return enabled && isConfigured();
    }
}
