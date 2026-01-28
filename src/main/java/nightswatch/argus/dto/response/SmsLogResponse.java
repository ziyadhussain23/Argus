package nightswatch.argus.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nightswatch.argus.entity.SmsLog;
import nightswatch.argus.util.PhoneNumberValidator;

import java.time.LocalDateTime;

/**
 * Response DTO for SMS log information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmsLogResponse {

    private Long id;
    private String phoneNumber; // Masked for privacy
    private String status;
    private String messagePreview; // First 50 chars
    private Integer segmentsCount;
    private String errorCode;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;

    /**
     * Create response from entity with masked phone number.
     */
    public static SmsLogResponse fromEntity(SmsLog smsLog) {
        return SmsLogResponse.builder()
                .id(smsLog.getId())
                .phoneNumber(PhoneNumberValidator.mask(smsLog.getPhoneNumber()))
                .status(smsLog.getStatus().name())
                .messagePreview(truncateMessage(smsLog.getMessageContent(), 50))
                .segmentsCount(smsLog.getSegmentsCount())
                .errorCode(smsLog.getErrorCode())
                .errorMessage(smsLog.getErrorMessage())
                .createdAt(smsLog.getCreatedAt())
                .sentAt(smsLog.getSentAt())
                .deliveredAt(smsLog.getDeliveredAt())
                .build();
    }

    private static String truncateMessage(String message, int maxLength) {
        if (message == null) return null;
        if (message.length() <= maxLength) return message;
        return message.substring(0, maxLength) + "...";
    }
}
