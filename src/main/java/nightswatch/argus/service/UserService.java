package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.dto.request.LoginRequest;
import nightswatch.argus.dto.request.RegisterRequest;
import nightswatch.argus.dto.response.AuthResponse;
import nightswatch.argus.entity.User;
import nightswatch.argus.exception.BadRequestException;
import nightswatch.argus.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user: {}", request.getUsername());

        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already taken");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Generate verification token
        String verificationToken = emailService.generateSecureToken();
        
        // Create new user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .isActive(true)
                .emailVerified(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiry(emailService.getTokenExpiry())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getUsername());

        // Send verification email asynchronously
        emailService.sendVerificationEmail(savedUser, verificationToken);
        log.info("Verification email sent to: {}", savedUser.getEmail());

        // Generate JWT token (user can login but functionality may be limited until verified)
        String token = jwtService.generateToken(savedUser);

        return buildAuthResponse(savedUser, token);
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());

        // Find user by username
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadRequestException("Invalid username or password"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Invalid password attempt for user: {}", request.getUsername());
            throw new BadRequestException("Invalid username or password");
        }

        // Check if user is active
        if (!user.getIsActive()) {
            throw new BadRequestException("Account is deactivated");
        }

        log.info("User logged in successfully: {}", user.getUsername());

        // Generate JWT token
        String token = jwtService.generateToken(user);

        return buildAuthResponse(user, token);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    @Transactional
    public void verifyEmail(String token) {
        log.info("Verifying email with token");
        
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification token"));
        
        // Check if token is expired
        if (user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification token has expired. Please request a new one.");
        }
        
        // Check if already verified
        if (user.getEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }
        
        // Mark user as verified
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        log.info("Email verified successfully for user: {}", user.getUsername());
        
        // Send welcome email
        emailService.sendWelcomeEmail(user);
    }
    
    @Transactional
    public void resendVerificationEmail(String email) {
        log.info("Resending verification email to: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found with email: " + email));
        
        // Check if already verified
        if (user.getEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }
        
        // Generate new verification token
        String verificationToken = emailService.generateSecureToken();
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiry(emailService.getTokenExpiry());
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        
        // Send verification email
        emailService.sendVerificationEmail(user, verificationToken);
        log.info("Verification email resent to: {}", email);
    }
    
    @Transactional
    public void requestPasswordReset(String email) {
        log.info("Password reset requested for email: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found with email: " + email));
        
        // Generate reset token
        String resetToken = emailService.generateSecureToken();
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(emailService.getTokenExpiry());
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        
        // Send password reset email
        emailService.sendPasswordResetEmail(user, resetToken);
        log.info("Password reset email sent to: {}", email);
    }
    
    @Transactional
    public void resetPassword(String token, String newPassword) {
        log.info("Resetting password with token");
        
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));
        
        // Check if token is expired
        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token has expired. Please request a new one.");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        log.info("Password reset successfully for user: {}", user.getUsername());
        
        // Send password changed confirmation email
        emailService.sendPasswordChangedEmail(user);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .user(AuthResponse.UserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .build())
                .build();
    }
}
