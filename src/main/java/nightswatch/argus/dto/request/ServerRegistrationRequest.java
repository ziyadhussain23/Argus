package nightswatch.argus.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServerRegistrationRequest {

    @NotBlank(message = "Server name is required")
    private String name;

    @NotBlank(message = "Host address is required")
    private String hostAddress;

    private String operatingSystem;

    private String description;
}
