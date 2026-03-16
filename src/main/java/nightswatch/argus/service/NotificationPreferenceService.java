package nightswatch.argus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.config.TwilioConfig;
import nightswatch.argus.dto.request.NotificationPreferenceRequest;
import nightswatch.argus.dto.response.NotificationPreferenceResponse;
import nightswatch.argus.entity.User;
import nightswatch.argus.entity.UserNotificationPreference;
import nightswatch.argus.exception.BadRequestException;
import nightswatch.argus.repository.UserNotificationPreferenceRepository;
import nightswatch.argus.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing user notification preferences.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPreferenceService {

    private final UserNotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final TwilioConfig twilioConfig;

    /**
     * Get notification preferences for a user.
     * Creates default preferences if none exist.
     * 
     * @param userId the user ID
     * @return notification preferences response
     */
    @Transactional
    public NotificationPreferenceResponse getPreferences(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        UserNotificationPreference preference = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(user));

        return NotificationPreferenceResponse.fromEntity(
                preference,
                user.getPhoneNumber(),
                user.getPhoneVerified(),
                twilioConfig.isAvailable()
        );
    }

    /**
     * Update notification preferences for a user.
     * 
     * @param userId the user ID
     * @param request the update request
     * @return updated preferences response
     */
    @Transactional
    public NotificationPreferenceResponse updatePreferences(Long userId, NotificationPreferenceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        UserNotificationPreference preference = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(user));

        // Validate SMS enablement
        if (Boolean.TRUE.equals(request.getSmsEnabled())) {
            if (user.getPhoneNumber() == null || user.getPhoneNumber().isBlank()) {
                throw new BadRequestException("Cannot enable SMS notifications without a phone number");
            }
            if (!twilioConfig.isAvailable()) {
                throw new BadRequestException("SMS service is not available. Please contact administrator.");
            }
        }

        // Update fields if provided
        if (request.getEmailEnabled() != null) {
            preference.setEmailEnabled(request.getEmailEnabled());
        }
        if (request.getSmsEnabled() != null) {
            preference.setSmsEnabled(request.getSmsEnabled());
        }
        if (request.getSmsForCriticalOnly() != null) {
            preference.setSmsForCriticalOnly(request.getSmsForCriticalOnly());
        }
        if (request.getQuietHoursEnabled() != null) {
            preference.setQuietHoursEnabled(request.getQuietHoursEnabled());
        }
        if (request.getQuietHoursStart() != null) {
            preference.setQuietHoursStart(request.getQuietHoursStart());
        }
        if (request.getQuietHoursEnd() != null) {
            preference.setQuietHoursEnd(request.getQuietHoursEnd());
        }

        // Validate quiet hours configuration
        if (Boolean.TRUE.equals(preference.getQuietHoursEnabled())) {
            if (preference.getQuietHoursStart() == null || preference.getQuietHoursEnd() == null) {
                throw new BadRequestException("Quiet hours start and end times are required when quiet hours are enabled");
            }
        }

        preference = preferenceRepository.save(preference);
        log.info("Updated notification preferences for user: {}", user.getUsername());

        return NotificationPreferenceResponse.fromEntity(
                preference,
                user.getPhoneNumber(),
                user.getPhoneVerified(),
                twilioConfig.isAvailable()
        );
    }

    /**
     * Check if SMS is enabled and allowed for a user and severity.
     * 
     * @param user the user
     * @param isCritical whether the alert is critical
     * @return true if SMS should be sent
     */
    public boolean shouldSendSms(User user, boolean isCritical) {
        // Re-fetch user to avoid LazyInitializationException when called from an @Async context
        // where the user object may be a detached proxy from a different Hibernate session
        String phoneNumber = userRepository.findById(user.getId())
                .map(User::getPhoneNumber)
                .orElse(null);
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return false;
        }

        if (!twilioConfig.isAvailable()) {
            return false;
        }

        return preferenceRepository.findByUserId(user.getId())
                .map(pref -> pref.isSmsAllowed(isCritical))
                .orElse(false);
    }

    /**
     * Check if email is enabled for a user.
     * 
     * @param userId the user ID
     * @return true if email notifications are enabled
     */
    public boolean isEmailEnabled(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .map(UserNotificationPreference::getEmailEnabled)
                .orElse(true); // Default to enabled
    }

    /**
     * Create default notification preferences for a user.
     * 
     * @param user the user
     * @return created preferences
     */
    private UserNotificationPreference createDefaultPreferences(User user) {
        UserNotificationPreference preference = UserNotificationPreference.builder()
                .user(user)
                .emailEnabled(true)
                .smsEnabled(false)
                .smsForCriticalOnly(true)
                .quietHoursEnabled(false)
                .build();
        
        return preferenceRepository.save(preference);
    }
}
