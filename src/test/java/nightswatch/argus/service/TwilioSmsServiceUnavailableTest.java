package nightswatch.argus.service;

import nightswatch.argus.config.TwilioConfig;
import nightswatch.argus.entity.SmsLog;
import nightswatch.argus.entity.User;
import nightswatch.argus.exception.SmsDeliveryException;
import nightswatch.argus.repository.SmsLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test that verifies the BUG-003 fix: when the SMS provider is not
 * configured, {@link TwilioSmsService#sendSms} must throw
 * {@link SmsDeliveryException} so that the caller (NotificationService) can
 * mark the notification record as FAILED instead of silently treating the SMS
 * as sent.
 */
@ExtendWith(MockitoExtension.class)
class TwilioSmsServiceUnavailableTest {

    @Mock private TwilioConfig twilioConfig;
    @Mock private SmsLogRepository smsLogRepository;
    @Mock private SmsTemplateService smsTemplateService;
    @Mock private SmsRateLimiter smsRateLimiter;

    @InjectMocks
    private TwilioSmsService twilioSmsService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).username("ziyad").phoneNumber("+15551234567").build();
        // SmsLogRepository.save returns whatever is passed in
        when(smsLogRepository.save(any(SmsLog.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("BUG-003 fix: sendSms throws SmsDeliveryException when Twilio is unavailable")
    void sendSms_whenTwilioUnavailable_throwsSmsDeliveryException() {
        when(twilioConfig.isAvailable()).thenReturn(false);

        assertThatThrownBy(() ->
                twilioSmsService.sendSms("+15551234567", "hello", user))
                .isInstanceOf(SmsDeliveryException.class)
                .hasMessageContaining("not configured");

        // The failed log should have been persisted before the exception
        verify(smsLogRepository, atLeastOnce()).save(any(SmsLog.class));
    }
}
