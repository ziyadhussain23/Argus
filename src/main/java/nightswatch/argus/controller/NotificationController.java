package nightswatch.argus.controller;

import lombok.RequiredArgsConstructor;
import nightswatch.argus.dto.response.ApiResponse;
import nightswatch.argus.dto.response.NotificationResponse;
import nightswatch.argus.entity.Notification;
import nightswatch.argus.entity.User;
import nightswatch.argus.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping("/alert/{alertId}")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotificationsByAlert(
            @PathVariable Long alertId,
            @AuthenticationPrincipal User user) {

        List<Notification> notifications = notificationRepository.findByAlertIdAndRecipientId(alertId, user.getId());
        List<NotificationResponse> response = notifications.stream()
                .map(NotificationResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
