package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.entity.User;
import nightswatch.argus.exception.BadRequestException;
import nightswatch.argus.repository.UserRepository;
import nightswatch.argus.util.PhoneNumberValidator;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Service for phone number verification via OTP.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PhoneVerificationService {

    private final UserRepository userRepository;
    private final SmsService smsService;
    private final StringRedisTemplate redisTemplate;

    private static final String OTP_KEY_PREFIX = "phone_otp:";
    private static final String RATE_LIMIT_KEY_PREFIX = "phone_otp_rate:";
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_OTP_REQUESTS_PER_HOUR = 3;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Update user's phone number and initiate verification.
     * 
     * @param userId the user ID
     * @param phoneNumber the new phone number
     */
    @Transactional
    public void updatePhoneNumber(Long userId, String phoneNumber) {
        // Validate phone number format
        if (!PhoneNumberValidator.isValid(phoneNumber)) {
            throw new BadRequestException(PhoneNumberValidator.getValidationError(phoneNumber));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        // Check if phone number is already in use
        if (userRepository.existsByPhoneNumber(phoneNumber) && 
            !phoneNumber.equals(user.getPhoneNumber())) {
            throw new BadRequestException("Phone number is already registered to another user");
        }

        // Update phone number and reset verification
        user.setPhoneNumber(phoneNumber);
        user.setPhoneVerified(false);
        userRepository.save(user);

        log.info("Phone number updated for user: {} to: {}", 
            user.getUsername(), PhoneNumberValidator.mask(phoneNumber));
    }

    /**
     * Send OTP for phone verification.
     * 
     * @param userId the user ID
     */
    @Transactional
    public void sendVerificationOtp(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getPhoneNumber() == null || user.getPhoneNumber().isBlank()) {
            throw new BadRequestException("No phone number configured");
        }

        if (Boolean.TRUE.equals(user.getPhoneVerified())) {
            throw new BadRequestException("Phone number is already verified");
        }

        // Check rate limit
        checkOtpRateLimit(userId);

        // Generate OTP
        String otp = generateOtp();

        // Store OTP in Redis with expiry
        String otpKey = OTP_KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(otpKey, otp, Duration.ofMinutes(OTP_EXPIRY_MINUTES));

        // Increment rate limit counter
        incrementOtpRateLimit(userId);

        // Send OTP via SMS
        smsService.sendVerificationSms(user, otp);

        log.info("Verification OTP sent to user: {}", user.getUsername());
    }

    /**
     * Verify OTP and mark phone as verified.
     * 
     * @param userId the user ID
     * @param otp the OTP to verify
     * @return true if verification successful
     */
    @Transactional
    public boolean verifyOtp(Long userId, String otp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (Boolean.TRUE.equals(user.getPhoneVerified())) {
            throw new BadRequestException("Phone number is already verified");
        }

        String otpKey = OTP_KEY_PREFIX + userId;
        String storedOtp = redisTemplate.opsForValue().get(otpKey);

        if (storedOtp == null) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        if (!storedOtp.equals(otp)) {
            log.warn("Invalid OTP attempt for user: {}", user.getUsername());
            throw new BadRequestException("Invalid OTP. Please try again.");
        }

        // Mark phone as verified
        user.setPhoneVerified(true);
        userRepository.save(user);

        // Delete OTP from Redis
        redisTemplate.delete(otpKey);

        log.info("Phone verified successfully for user: {}", user.getUsername());
        return true;
    }

    /**
     * Remove phone number from user account.
     * 
     * @param userId the user ID
     */
    @Transactional
    public void removePhoneNumber(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setPhoneNumber(null);
        user.setPhoneVerified(false);
        userRepository.save(user);

        log.info("Phone number removed for user: {}", user.getUsername());
    }

    private String generateOtp() {
        int otp = secureRandom.nextInt((int) Math.pow(10, OTP_LENGTH));
        return String.format("%0" + OTP_LENGTH + "d", otp);
    }

    private void checkOtpRateLimit(Long userId) {
        String rateKey = RATE_LIMIT_KEY_PREFIX + userId;
        String countStr = redisTemplate.opsForValue().get(rateKey);
        
        if (countStr != null) {
            int count = Integer.parseInt(countStr);
            if (count >= MAX_OTP_REQUESTS_PER_HOUR) {
                throw new BadRequestException(
                    "Too many OTP requests. Please wait before requesting another code."
                );
            }
        }
    }

    private void incrementOtpRateLimit(Long userId) {
        String rateKey = RATE_LIMIT_KEY_PREFIX + userId;
        Long count = redisTemplate.opsForValue().increment(rateKey);
        
        if (count != null && count == 1) {
            redisTemplate.expire(rateKey, 1, TimeUnit.HOURS);
        }
    }
}
