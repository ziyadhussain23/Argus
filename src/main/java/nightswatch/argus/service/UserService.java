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
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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
        String username = request.getUsername() != null ? request.getUsername().trim() : null;
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase(Locale.ROOT) : null;

        log.info("Registering new user: {}", username);

        // Check if username already exists
        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Username already taken");
        }

        // Check if email already exists (case-insensitive)
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Email already registered");
        }

        // Prevent ambiguous login identifiers:
        // - username cannot equal an existing email
        // - email cannot equal an existing username
        if (userRepository.existsByEmailIgnoreCase(username)) {
            throw new BadRequestException("Username cannot be used because it matches an existing email");
        }
        if (userRepository.existsByUsernameIgnoreCase(email)) {
            throw new BadRequestException("Email cannot be used because it matches an existing username");
        }

        // Generate verification token
        String verificationToken = emailService.generateSecureToken();
        
        // Create new user
        User user = User.builder()
            .username(username)
            .email(email)
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
        String identifier = request.getUsername() != null ? request.getUsername().trim() : "";
        log.info("Login attempt for identifier: {}", identifier);

        // Find user by username OR email (case-insensitive email)
        List<User> candidates = new ArrayList<>(2);

        userRepository.findByUsername(identifier).ifPresent(candidates::add);
        userRepository.findByEmailIgnoreCase(identifier)
                .ifPresent(user -> {
                    boolean alreadyAdded = candidates.stream().anyMatch(u -> u.getId().equals(user.getId()));
                    if (!alreadyAdded) {
                        candidates.add(user);
                    }
                });

        if (candidates.isEmpty()) {
            throw new BadRequestException("Invalid username/email or password");
        }

        List<User> passwordMatches = candidates.stream()
                .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPassword()))
                .toList();

        if (passwordMatches.isEmpty()) {
            log.warn("Invalid password attempt for identifier: {}", identifier);
            throw new BadRequestException("Invalid username/email or password");
        }

        if (passwordMatches.size() > 1) {
            throw new BadRequestException("Ambiguous login identifier. Please log in using your username.");
        }

        User user = passwordMatches.get(0);

        // Check if user is active
        if (!user.getIsActive()) {
            throw new BadRequestException("Account is deactivated");
        }

        // Check if email is verified
        if (!user.getEmailVerified()) {
            log.warn("Login attempt with unverified email for user: {}", user.getUsername());
            throw new BadRequestException("Email not verified. Please verify your email before logging in.");
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

    public String getUserEmailByUsername(String username) {
        log.info("Getting email for username: {}", username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("User not found with username: " + username));
        
        return user.getEmail();
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

    @Transactional
    public void changePassword(User user, String currentPassword, String newPassword) {
        log.info("Changing password for user: {}", user.getUsername());

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Password changed successfully for user: {}", user.getUsername());
    }

    @Transactional
    public void deleteAccount(User user) {
        log.info("Deleting account for user: {}", user.getUsername());
        userRepository.delete(user);
        log.info("Account deleted successfully for user: {}", user.getUsername());
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
