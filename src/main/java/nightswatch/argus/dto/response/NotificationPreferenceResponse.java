package nightswatch.argus.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nightswatch.argus.entity.UserNotificationPreference;

/**
 * Response DTO for notification preferences.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceResponse {

    private Long id;
    private Boolean emailEnabled;
    private Boolean smsEnabled;
    private Boolean smsForCriticalOnly;
    private Boolean quietHoursEnabled;
    private Integer quietHoursStart;
    private Integer quietHoursEnd;
    private String phoneNumber;
    private Boolean phoneVerified;
    private Boolean smsAvailable;

    /**
     * Create response from entity.
     */
    public static NotificationPreferenceResponse fromEntity(
            UserNotificationPreference preference, 
            String phoneNumber, 
            Boolean phoneVerified,
            Boolean smsAvailable) {
        return NotificationPreferenceResponse.builder()
                .id(preference.getId())
                .emailEnabled(preference.getEmailEnabled())
                .smsEnabled(preference.getSmsEnabled())
                .smsForCriticalOnly(preference.getSmsForCriticalOnly())
                .quietHoursEnabled(preference.getQuietHoursEnabled())
                .quietHoursStart(preference.getQuietHoursStart())
                .quietHoursEnd(preference.getQuietHoursEnd())
                .phoneNumber(phoneNumber != null ? maskPhoneNumber(phoneNumber) : null)
                .phoneVerified(phoneVerified)
                .smsAvailable(smsAvailable)
                .build();
    }

    /**
     * Mask phone number for privacy (e.g., +1******1234).
     */
    private static String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 8) {
            return phoneNumber;
        }
        int visibleStart = 2;
        int visibleEnd = 4;
        String start = phoneNumber.substring(0, visibleStart);
        String end = phoneNumber.substring(phoneNumber.length() - visibleEnd);
        String middle = "*".repeat(phoneNumber.length() - visibleStart - visibleEnd);
        return start + middle + end;
    }
}
