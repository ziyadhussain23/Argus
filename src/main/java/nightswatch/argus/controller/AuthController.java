package nightswatch.argus.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.dto.request.ChangePasswordRequest;
import nightswatch.argus.dto.request.LoginRequest;
import nightswatch.argus.dto.request.RegisterRequest;
import nightswatch.argus.dto.request.VerifyTokenRequest;
import nightswatch.argus.dto.response.ApiResponse;
import nightswatch.argus.dto.response.AuthResponse;
import nightswatch.argus.entity.User;
import nightswatch.argus.exception.BadRequestException;
import nightswatch.argus.service.JwtService;
import nightswatch.argus.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration request for username: {}", request.getUsername());
        
        AuthResponse authResponse = userService.register(request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", authResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request for username: {}", request.getUsername());
        
        AuthResponse authResponse = userService.login(request);
        
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<String>> validateToken(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new BadRequestException("Invalid or missing token");
        }
        return ResponseEntity.ok(ApiResponse.success("Token is valid", "OK"));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<String>> verifyToken(@Valid @RequestBody VerifyTokenRequest request) {
        if (!jwtService.isTokenValid(request.getToken())) {
            throw new BadRequestException("Invalid token");
        }
        return ResponseEntity.ok(ApiResponse.success("Token is valid", "OK"));
    }
    
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@RequestParam String token) {
        log.info("Email verification request with token");
        
        userService.verifyEmail(token);
        
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully. Welcome to Argus!", "VERIFIED"));
    }
    
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<String>> resendVerification(@RequestParam String email) {
        log.info("Resend verification request for email: {}", email);
        
        userService.resendVerificationEmail(email);
        
        return ResponseEntity.ok(ApiResponse.success("Verification email sent. Please check your inbox.", "SENT"));
    }

    @GetMapping("/get-email")
    public ResponseEntity<ApiResponse<String>> getUserEmail(@RequestParam String username) {
        log.info("Get email request for username: {}", username);
        
        String email = userService.getUserEmailByUsername(username);
        
        return ResponseEntity.ok(ApiResponse.success("Email retrieved successfully", email));
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestParam String email) {
        log.info("Forgot password request for email: {}", email);
        
        userService.requestPasswordReset(email);
        
        return ResponseEntity.ok(ApiResponse.success("Password reset email sent. Please check your inbox.", "SENT"));
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @RequestParam String token,
            @RequestParam String newPassword) {
        log.info("Reset password request with token");
        
        userService.resetPassword(token, newPassword);
        
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully. You can now login with your new password.", "RESET"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            throw new BadRequestException("Authentication required");
        }

        userService.changePassword(user, request.getCurrentPassword(), request.getNewPassword());

        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", "CHANGED"));
    }

    @DeleteMapping("/account")
    public ResponseEntity<ApiResponse<String>> deleteAccount(
            @AuthenticationPrincipal User user) {
        if (user == null) {
            throw new BadRequestException("Authentication required");
        }

        userService.deleteAccount(user);

        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully", "DELETED"));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<AuthResponse.UserResponse>> getProfile(
            @AuthenticationPrincipal User user) {
        if (user == null) {
            throw new BadRequestException("Authentication required");
        }

        User fullUser = userService.findById(user.getId());
        AuthResponse.UserResponse profile = AuthResponse.UserResponse.builder()
                .id(fullUser.getId())
                .username(fullUser.getUsername())
                .email(fullUser.getEmail())
                .role(fullUser.getRole().name())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Profile retrieved", profile));
    }
}
