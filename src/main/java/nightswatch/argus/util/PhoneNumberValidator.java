package nightswatch.argus.util;

import java.util.regex.Pattern;

/**
 * Utility class for phone number validation and formatting.
 * Supports E.164 international phone number format.
 */
public final class PhoneNumberValidator {

    // E.164 format: + followed by 1-15 digits, starting with non-zero
    private static final Pattern E164_PATTERN = Pattern.compile("^\\+[1-9]\\d{1,14}$");

    // Common country codes for validation hints
    private static final String[] COMMON_COUNTRY_CODES = {
        "+1",   // USA, Canada
        "+44",  // UK
        "+91",  // India
        "+86",  // China
        "+81",  // Japan
        "+49",  // Germany
        "+33",  // France
        "+61",  // Australia
        "+55",  // Brazil
        "+7"    // Russia
    };

    private PhoneNumberValidator() {
        // Utility class
    }

    /**
     * Validate phone number in E.164 format.
     * 
     * @param phoneNumber the phone number to validate
     * @return true if valid E.164 format
     */
    public static boolean isValid(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return false;
        }
        return E164_PATTERN.matcher(phoneNumber.trim()).matches();
    }

    /**
     * Normalize phone number to E.164 format if possible.
     * 
     * @param phoneNumber raw phone number input
     * @param defaultCountryCode default country code if not provided
     * @return normalized phone number or null if invalid
     */
    public static String normalize(String phoneNumber, String defaultCountryCode) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return null;
        }

        // Remove common formatting characters
        String cleaned = phoneNumber.replaceAll("[\\s\\-\\(\\)\\.]", "");

        // Already in E.164 format
        if (cleaned.startsWith("+")) {
            return isValid(cleaned) ? cleaned : null;
        }

        // Starts with 00 (international prefix in some countries)
        if (cleaned.startsWith("00")) {
            cleaned = "+" + cleaned.substring(2);
            return isValid(cleaned) ? cleaned : null;
        }

        // Add default country code
        if (defaultCountryCode != null && !defaultCountryCode.isBlank()) {
            String withCountry = defaultCountryCode + (cleaned.startsWith("0") ? cleaned.substring(1) : cleaned);
            return isValid(withCountry) ? withCountry : null;
        }

        return null;
    }

    /**
     * Extract country code from E.164 phone number.
     * 
     * @param phoneNumber phone number in E.164 format
     * @return country code or null if not found
     */
    public static String extractCountryCode(String phoneNumber) {
        if (!isValid(phoneNumber)) {
            return null;
        }

        // Check common country codes (longer codes first)
        for (String code : COMMON_COUNTRY_CODES) {
            if (phoneNumber.startsWith(code)) {
                return code;
            }
        }

        // Default: assume 1-3 digit country code
        if (phoneNumber.length() >= 3) {
            return phoneNumber.substring(0, Math.min(4, phoneNumber.length()));
        }

        return null;
    }

    /**
     * Mask phone number for display (privacy).
     * Shows first 2 and last 4 characters.
     * 
     * @param phoneNumber phone number to mask
     * @return masked phone number
     */
    public static String mask(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 8) {
            return phoneNumber;
        }
        int visibleStart = 2;
        int visibleEnd = 4;
        String start = phoneNumber.substring(0, visibleStart);
        String end = phoneNumber.substring(phoneNumber.length() - visibleEnd);
        String middle = "*".repeat(phoneNumber.length() - visibleStart - visibleEnd);
        return start + middle + end;
    }

    /**
     * Get validation error message for invalid phone number.
     * 
     * @param phoneNumber the invalid phone number
     * @return descriptive error message
     */
    public static String getValidationError(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return "Phone number is required";
        }
        if (!phoneNumber.startsWith("+")) {
            return "Phone number must start with + and country code (e.g., +1 for USA)";
        }
        if (phoneNumber.length() < 8) {
            return "Phone number is too short";
        }
        if (phoneNumber.length() > 16) {
            return "Phone number is too long";
        }
        return "Invalid phone number format. Use E.164 format (e.g., +14155551234)";
    }
}
