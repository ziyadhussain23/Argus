package nightswatch.argus.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nightswatch.argus.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    
    @Value("${app.mail.from-email}")
    private String fromEmail;
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;
    
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_EXPIRY_HOURS = 24;
    
    /**
     * Generate a secure random token for email verification or password reset
     */
    public String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(randomBytes);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 algorithm not available", e);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        }
    }
    
    /**
     * Get token expiry time (24 hours from now)
     */
    public LocalDateTime getTokenExpiry() {
        return LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS);
    }
    
    /**
     * Send email verification to new user
     */
    @Async
    public void sendVerificationEmail(User user, String verificationToken) {
        try {
            String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;
            
            String subject = "Verify Your Argus Account";
            String htmlContent = buildVerificationEmailHtml(user.getUsername(), verificationLink);
            
            sendHtmlEmail(user.getEmail(), subject, htmlContent);
            log.info("Verification email sent to: {}", user.getEmail());
        } catch (MessagingException e) {
            log.error("Failed to send verification email to: {}", user.getEmail(), e);
        }
    }
    
    /**
     * Send welcome email after successful verification
     */
    @Async
    public void sendWelcomeEmail(User user) {
        try {
            String subject = "Welcome to Argus - Your Server Monitoring Platform";
            String htmlContent = buildWelcomeEmailHtml(user.getUsername());
            
            sendHtmlEmail(user.getEmail(), subject, htmlContent);
            log.info("Welcome email sent to: {}", user.getEmail());
        } catch (MessagingException e) {
            log.error("Failed to send welcome email to: {}", user.getEmail(), e);
        }
    }
    
    /**
     * Send password reset email
     */
    @Async
    public void sendPasswordResetEmail(User user, String resetToken) {
        try {
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
            
            String subject = "Reset Your Argus Password";
            String htmlContent = buildPasswordResetEmailHtml(user.getUsername(), resetLink);
            
            sendHtmlEmail(user.getEmail(), subject, htmlContent);
            log.info("Password reset email sent to: {}", user.getEmail());
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to: {}", user.getEmail(), e);
        }
    }
    
    /**
     * Send password change confirmation email
     */
    @Async
    public void sendPasswordChangedEmail(User user) {
        try {
            String subject = "Your Argus Password Has Been Changed";
            String htmlContent = buildPasswordChangedEmailHtml(user.getUsername());
            
            sendHtmlEmail(user.getEmail(), subject, htmlContent);
            log.info("Password changed confirmation sent to: {}", user.getEmail());
        } catch (MessagingException e) {
            log.error("Failed to send password changed email to: {}", user.getEmail(), e);
        }
    }

    @Async
    public void sendInfrastructureReportEmail(List<String> recipients, String subject, String htmlContent) {
        if (recipients == null || recipients.isEmpty()) {
            return;
        }
        for (String recipient : recipients) {
            try {
                sendHtmlEmail(recipient, subject, htmlContent);
            } catch (MessagingException e) {
                log.error("Failed to send infrastructure report to: {}", recipient, e);
            }
        }
    }
    
    /**
     * Core method to send HTML email
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
        
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        
        mailSender.send(message);
    }
    
    /**
     * Build HTML template for verification email
     */
    private String buildVerificationEmailHtml(String username, String verificationLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">⚔️ Argus</h1>
                                        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Server Monitoring Platform</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
                                        <p style="color: #666666; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                                            Hi <strong>%s</strong>,
                                        </p>
                                        <p style="color: #666666; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                                            Thank you for registering with Argus! To complete your registration and start monitoring your servers, 
                                            please verify your email address by clicking the button below.
                                        </p>
                                        
                                        <!-- CTA Button -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                            <tr>
                                                <td align="center">
                                                    <a href="%s" style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                                                        Verify Email Address
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color: #666666; margin: 20px 0 0 0; font-size: 14px; line-height: 1.6;">
                                            Or copy and paste this link into your browser:
                                        </p>
                                        <p style="color: #667eea; margin: 10px 0 0 0; font-size: 14px; word-break: break-all;">
                                            %s
                                        </p>
                                        
                                        <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eeeeee;">
                                            <p style="color: #999999; margin: 0; font-size: 14px; line-height: 1.6;">
                                                <strong>Note:</strong> This verification link will expire in 24 hours. If you didn't create an account with Argus, 
                                                you can safely ignore this email.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
                                        <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                            &copy; 2026 Argus Server Monitoring. All rights reserved.
                                        </p>
                                        <p style="color: #999999; margin: 0; font-size: 12px;">
                                            Watch over your infrastructure, day and night.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(username, verificationLink, verificationLink);
    }
    
    /**
     * Build HTML template for welcome email
     */
    private String buildWelcomeEmailHtml(String username) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">⚔️ Argus</h1>
                                        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Welcome aboard!</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">🎉 Welcome to Argus!</h2>
                                        <p style="color: #666666; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                                            Hi <strong>%s</strong>,
                                        </p>
                                        <p style="color: #666666; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                                            Your email has been successfully verified! You're all set to start monitoring your servers with Argus.
                                        </p>
                                        
                                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 30px 0;">
                                            <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">🚀 Getting Started</h3>
                                            <ul style="color: #666666; margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.8;">
                                                <li>Add your first server from the dashboard</li>
                                                <li>Install the Argus agent on your servers</li>
                                                <li>Configure alert rules to monitor critical metrics</li>
                                                <li>Set up custom thresholds for CPU, memory, and disk usage</li>
                                                <li>Receive real-time alerts via email</li>
                                            </ul>
                                        </div>
                                        
                                        <!-- CTA Button -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                            <tr>
                                                <td align="center">
                                                    <a href="%s/dashboard" style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                                                        Go to Dashboard
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eeeeee;">
                                            <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.6;">
                                                Need help? Check out our documentation or contact support at 
                                                <a href="mailto:support@argus.io" style="color: #667eea; text-decoration: none;">support@argus.io</a>
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
                                        <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                            &copy; 2026 Argus Server Monitoring. All rights reserved.
                                        </p>
                                        <p style="color: #999999; margin: 0; font-size: 12px;">
                                            Watch over your infrastructure, day and night.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(username, frontendUrl);
    }
    
    /**
     * Build HTML template for password reset email
     */
    private String buildPasswordResetEmailHtml(String username, String resetLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">⚔️ Argus</h1>
                                        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
                                        <p style="color: #666666; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                                            Hi <strong>%s</strong>,
                                        </p>
                                        <p style="color: #666666; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                                            We received a request to reset the password for your Argus account. Click the button below to create a new password.
                                        </p>
                                        
                                        <!-- CTA Button -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                            <tr>
                                                <td align="center">
                                                    <a href="%s" style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                                                        Reset Password
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color: #666666; margin: 20px 0 0 0; font-size: 14px; line-height: 1.6;">
                                            Or copy and paste this link into your browser:
                                        </p>
                                        <p style="color: #667eea; margin: 10px 0 0 0; font-size: 14px; word-break: break-all;">
                                            %s
                                        </p>
                                        
                                        <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                                            <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
                                                <strong>⚠️ Security Note:</strong> This password reset link will expire in 24 hours. 
                                                If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
                                        <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                            &copy; 2026 Argus Server Monitoring. All rights reserved.
                                        </p>
                                        <p style="color: #999999; margin: 0; font-size: 12px;">
                                            Watch over your infrastructure, day and night.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(username, resetLink, resetLink);
    }
    
    /**
     * Build HTML template for password changed confirmation
     */
    private String buildPasswordChangedEmailHtml(String username) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">⚔️ Argus</h1>
                                        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Password Changed</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">✓ Password Successfully Changed</h2>
                                        <p style="color: #666666; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                                            Hi <strong>%s</strong>,
                                        </p>
                                        <p style="color: #666666; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                                            This is a confirmation that the password for your Argus account has been successfully changed.
                                        </p>
                                        
                                        <div style="margin: 30px 0; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
                                            <p style="color: #155724; margin: 0; font-size: 14px; line-height: 1.6;">
                                                <strong>✓ Your account is secure.</strong> You can now use your new password to log in to Argus.
                                            </p>
                                        </div>
                                        
                                        <!-- CTA Button -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                            <tr>
                                                <td align="center">
                                                    <a href="%s/login" style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                                                        Log In to Argus
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <div style="margin-top: 30px; padding: 20px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
                                            <p style="color: #721c24; margin: 0; font-size: 14px; line-height: 1.6;">
                                                <strong>⚠️ Didn't change your password?</strong> If you didn't make this change, 
                                                please contact our support team immediately at 
                                                <a href="mailto:support@argus.io" style="color: #721c24; text-decoration: underline;">support@argus.io</a>
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
                                        <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                            &copy; 2026 Argus Server Monitoring. All rights reserved.
                                        </p>
                                        <p style="color: #999999; margin: 0; font-size: 12px;">
                                            Watch over your infrastructure, day and night.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(username, frontendUrl);
    }
}
