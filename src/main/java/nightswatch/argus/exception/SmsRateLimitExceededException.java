package nightswatch.argus.exception;

/**
 * Exception thrown when SMS rate limit is exceeded.
 */
public class SmsRateLimitExceededException extends RuntimeException {

    private final int limit;
    private final String period;

    public SmsRateLimitExceededException(int limit, String period) {
        super(String.format("SMS rate limit exceeded: %d messages per %s", limit, period));
        this.limit = limit;
        this.period = period;
    }

    public int getLimit() {
        return limit;
    }

    public String getPeriod() {
        return period;
    }
}
