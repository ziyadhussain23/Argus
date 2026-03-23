package nightswatch.argus.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.dto.request.NotificationPreferenceRequest;
import nightswatch.argus.dto.request.PhoneNumberUpdateRequest;
import nightswatch.argus.dto.response.ApiResponse;
import nightswatch.argus.dto.response.NotificationPreferenceResponse;
import nightswatch.argus.entity.User;
import nightswatch.argus.service.NotificationPreferenceService;
import nightswatch.argus.service.PhoneVerificationService;
import nightswatch.argus.service.SmsRateLimiter;
import nightswatch.argus.service.SmsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for managing notification preferences and phone settings.
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;
    private final PhoneVerificationService phoneVerificationService;
    private final SmsService smsService;
    private final SmsRateLimiter smsRateLimiter;

    /**
     * Get current user's notification preferences.
     */
    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreferenceResponse>> getPreferences(
            @AuthenticationPrincipal User user) {

        NotificationPreferenceResponse response = preferenceService.getPreferences(user.getId());
        
        return ResponseEntity.ok(ApiResponse.success("Notification preferences retrieved", response));
    }

    /**
     * Update notification preferences.
     */
    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreferenceResponse>> updatePreferences(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody NotificationPreferenceRequest request) {

        log.info("Updating notification preferences for user: {}", user.getUsername());
        
        NotificationPreferenceResponse response = preferenceService.updatePreferences(user.getId(), request);
        
        return ResponseEntity.ok(ApiResponse.success("Notification preferences updated", response));
    }

    /**
     * Update phone number.
     */
    @PutMapping("/phone")
    public ResponseEntity<ApiResponse<String>> updatePhoneNumber(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PhoneNumberUpdateRequest request) {

        log.info("Updating phone number for user: {}", user.getUsername());
        
        phoneVerificationService.updatePhoneNumber(user.getId(), request.getPhoneNumber());
        
        return ResponseEntity.ok(ApiResponse.success(
            "Phone number updated. Please verify your phone number.", 
            "UPDATED"
        ));
    }

    /**
     * Remove phone number.
     */
    @DeleteMapping("/phone")
    public ResponseEntity<ApiResponse<String>> removePhoneNumber(
            @AuthenticationPrincipal User user) {

        log.info("Removing phone number for user: {}", user.getUsername());
        
        phoneVerificationService.removePhoneNumber(user.getId());
        
        return ResponseEntity.ok(ApiResponse.success("Phone number removed", "REMOVED"));
    }

    /**
     * Send phone verification OTP.
     */
    @PostMapping("/phone/verify/send")
    public ResponseEntity<ApiResponse<String>> sendVerificationOtp(
            @AuthenticationPrincipal User user) {

        log.info("Sending phone verification OTP for user: {}", user.getUsername());
        
        phoneVerificationService.sendVerificationOtp(user.getId());
        
        return ResponseEntity.ok(ApiResponse.success(
            "Verification code sent to your phone", 
            "SENT"
        ));
    }

    /**
     * Verify phone with OTP.
     */
    @PostMapping("/phone/verify")
    public ResponseEntity<ApiResponse<String>> verifyPhone(
            @AuthenticationPrincipal User user,
            @RequestParam String otp) {

        log.info("Verifying phone for user: {}", user.getUsername());
        
        phoneVerificationService.verifyOtp(user.getId(), otp);
        
        return ResponseEntity.ok(ApiResponse.success(
            "Phone number verified successfully", 
            "VERIFIED"
        ));
    }

    /**
     * Send test SMS to verify configuration.
     */
    @PostMapping("/sms/test")
    public ResponseEntity<ApiResponse<String>> sendTestSms(
            @AuthenticationPrincipal User user) {

        log.info("Sending test SMS for user: {}", user.getUsername());
        
        smsService.sendTestSms(user);
        
        return ResponseEntity.ok(ApiResponse.success(
            "Test SMS sent to your phone", 
            "SENT"
        ));
    }

    /**
     * Get SMS usage statistics.
     */
    @GetMapping("/sms/usage")
    public ResponseEntity<ApiResponse<SmsRateLimiter.SmsUsageStats>> getSmsUsage(
            @AuthenticationPrincipal User user) {

        SmsRateLimiter.SmsUsageStats stats = smsRateLimiter.getUsageStats(user.getId());
        
        return ResponseEntity.ok(ApiResponse.success("SMS usage statistics", stats));
    }

    /**
     * Check if SMS service is available.
     */
    @GetMapping("/sms/status")
    public ResponseEntity<ApiResponse<SmsStatusResponse>> getSmsStatus() {
        boolean available = smsService.isAvailable();
        
        SmsStatusResponse status = new SmsStatusResponse(
            available,
            available ? "SMS service is available" : "SMS service is not configured"
        );
        
        return ResponseEntity.ok(ApiResponse.success("SMS service status", status));
    }

    /**
     * Response record for SMS status.
     */
    public record SmsStatusResponse(boolean available, String message) {}
}
