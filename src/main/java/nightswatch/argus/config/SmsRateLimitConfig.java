package nightswatch.argus.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for SMS rate limiting.
 * Prevents excessive SMS sending to control costs and avoid abuse.
 */
@Configuration
@Getter
public class SmsRateLimitConfig {

    @Value("${sms.rate-limit.max-per-hour:10}")
    private int maxPerHour;

    @Value("${sms.rate-limit.max-per-day:50}")
    private int maxPerDay;
}
