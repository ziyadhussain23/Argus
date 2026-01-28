package nightswatch.argus.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating notification preferences.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceRequest {

    private Boolean emailEnabled;

    private Boolean smsEnabled;

    private Boolean smsForCriticalOnly;

    private Boolean quietHoursEnabled;

    @Min(value = 0, message = "Quiet hours start must be between 0 and 23")
    @Max(value = 23, message = "Quiet hours start must be between 0 and 23")
    private Integer quietHoursStart;

    @Min(value = 0, message = "Quiet hours end must be between 0 and 23")
    @Max(value = 23, message = "Quiet hours end must be between 0 and 23")
    private Integer quietHoursEnd;
}
