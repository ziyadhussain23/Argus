package nightswatch.argus.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@EnableAsync
public class SchedulingConfig {
    // Enables @Scheduled and @Async annotations for:
    // - Alert evaluation
    // - Notification retries
    // - Metric cleanup
    // - Server heartbeat monitoring
}
