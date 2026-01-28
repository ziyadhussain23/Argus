package nightswatch.argus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating user phone number.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhoneNumberUpdateRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^\\+[1-9]\\d{1,14}$",
        message = "Phone number must be in E.164 format (e.g., +14155551234)"
    )
    private String phoneNumber;
}
