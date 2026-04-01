package nightswatch.argus.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nightswatch.argus.dto.request.ScheduledReportRequest;
import nightswatch.argus.dto.response.ApiResponse;
import nightswatch.argus.dto.response.ScheduledReportResponse;
import nightswatch.argus.entity.User;
import nightswatch.argus.service.ScheduledReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ScheduledReportController {

    private final ScheduledReportService scheduledReportService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ScheduledReportResponse>>> getReports(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(scheduledReportService.getReports(user)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ScheduledReportResponse>> createReport(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ScheduledReportRequest request) {
        ScheduledReportResponse created = scheduledReportService.createReport(user, request);
        return ResponseEntity.ok(ApiResponse.success("Scheduled report created", created));
    }

    @PutMapping("/{reportId}")
    public ResponseEntity<ApiResponse<ScheduledReportResponse>> updateReport(
            @PathVariable Long reportId,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ScheduledReportRequest request) {
        ScheduledReportResponse updated = scheduledReportService.updateReport(reportId, user, request);
        return ResponseEntity.ok(ApiResponse.success("Scheduled report updated", updated));
    }

    @DeleteMapping("/{reportId}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(
            @PathVariable Long reportId,
            @AuthenticationPrincipal User user) {
        scheduledReportService.deleteReport(reportId, user);
        return ResponseEntity.ok(ApiResponse.success("Scheduled report deleted", null));
    }
}
