package nightswatch.argus.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.dto.request.LoginRequest;
import nightswatch.argus.dto.request.RegisterRequest;
import nightswatch.argus.dto.response.ApiResponse;
import nightswatch.argus.dto.response.AuthResponse;
import nightswatch.argus.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;

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
    public ResponseEntity<ApiResponse<String>> validateToken() {
        // If this endpoint is reached, the token is valid (JWT filter already validated it)
        return ResponseEntity.ok(ApiResponse.success("Token is valid", "OK"));
    }
}
