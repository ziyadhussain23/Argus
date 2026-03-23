package nightswatch.argus.repository;

import nightswatch.argus.entity.User;
import nightswatch.argus.entity.UserNotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for UserNotificationPreference entity.
 */
@Repository
public interface UserNotificationPreferenceRepository extends JpaRepository<UserNotificationPreference, Long> {

    /**
     * Find notification preferences by user.
     */
    Optional<UserNotificationPreference> findByUser(User user);

    /**
     * Find notification preferences by user ID.
     */
    Optional<UserNotificationPreference> findByUserId(Long userId);

    /**
     * Check if preferences exist for a user.
     */
    boolean existsByUserId(Long userId);

    void deleteByUserId(Long userId);
}
