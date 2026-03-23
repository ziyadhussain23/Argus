package nightswatch.argus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduledReportRequest {

    @NotBlank(message = "Report name is required")
    private String name;

    @NotBlank(message = "Format is required")
    private String format;

    private Set<Long> servers;

    @NotEmpty(message = "At least one metric is required")
    private Set<String> metrics;

    @NotBlank(message = "Timeframe is required")
    private String timeframe;

    @NotBlank(message = "Frequency is required")
    private String frequency;

    private String recipients;

    @NotNull(message = "Enabled status is required")
    private Boolean enabled;
}
