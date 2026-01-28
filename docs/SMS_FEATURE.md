# SMS Alert Feature Documentation

## Overview

Argus supports SMS notifications for critical alerts via Twilio. This allows users to receive immediate SMS alerts when critical server issues are detected.

## Setup Requirements

### 1. Twilio Account

1. Sign up at [Twilio Console](https://console.twilio.com)
2. Get your credentials:
   - **Account SID**: Found on dashboard
   - **Auth Token**: Found on dashboard (keep secret!)
   - **Phone Number**: Buy a phone number with SMS capability

### 2. Configuration

Add the following to your `application.properties`:

```properties
# Twilio SMS Configuration
twilio.account-sid=${TWILIO_ACCOUNT_SID}
twilio.auth-token=${TWILIO_AUTH_TOKEN}
twilio.phone-number=${TWILIO_PHONE_NUMBER}
twilio.enabled=true

# SMS Rate Limiting
sms.rate-limit.max-per-hour=10
sms.rate-limit.max-per-day=50
```

Or set environment variables:
```bash
export TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export TWILIO_AUTH_TOKEN=your-auth-token
export TWILIO_PHONE_NUMBER=+1234567890
export TWILIO_ENABLED=true
```

### 3. Webhook Configuration (Optional)

For delivery status tracking, configure Twilio webhooks:

1. Go to Twilio Console → Phone Numbers → Your Number
2. Set the "A MESSAGE COMES IN" webhook to:
   ```
   https://yourdomain.com/api/v1/webhooks/sms/status
   ```
3. Set HTTP method to POST

## API Endpoints

### Notification Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications/preferences` | Get notification preferences |
| PUT | `/api/v1/notifications/preferences` | Update notification preferences |

### Phone Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/v1/notifications/phone` | Update phone number |
| DELETE | `/api/v1/notifications/phone` | Remove phone number |
| POST | `/api/v1/notifications/phone/verify/send` | Send verification OTP |
| POST | `/api/v1/notifications/phone/verify?otp=123456` | Verify phone with OTP |

### SMS Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/notifications/sms/test` | Send test SMS |
| GET | `/api/v1/notifications/sms/usage` | Get SMS usage stats |
| GET | `/api/v1/notifications/sms/status` | Check SMS service status |

## Usage Flow

### 1. Add Phone Number

```bash
curl -X PUT http://localhost:8080/api/v1/notifications/phone \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+14155551234"}'
```

### 2. Verify Phone (Required for SMS)

```bash
# Request OTP
curl -X POST http://localhost:8080/api/v1/notifications/phone/verify/send \
  -H "Authorization: Bearer <token>"

# Verify with OTP received via SMS
curl -X POST "http://localhost:8080/api/v1/notifications/phone/verify?otp=123456" \
  -H "Authorization: Bearer <token>"
```

### 3. Enable SMS Notifications

```bash
curl -X PUT http://localhost:8080/api/v1/notifications/preferences \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "smsEnabled": true,
    "smsForCriticalOnly": true
  }'
```

### 4. Test SMS Configuration

```bash
curl -X POST http://localhost:8080/api/v1/notifications/sms/test \
  -H "Authorization: Bearer <token>"
```

## Rate Limiting

To control costs and prevent abuse:

- **Hourly limit**: 10 SMS per user per hour (default)
- **Daily limit**: 50 SMS per user per day (default)

Configure limits in `application.properties`:
```properties
sms.rate-limit.max-per-hour=10
sms.rate-limit.max-per-day=50
```

## Phone Number Format

Phone numbers must be in **E.164 format**:
- Starts with `+`
- Country code followed by number
- No spaces, dashes, or parentheses

Examples:
- ✅ `+14155551234` (USA)
- ✅ `+447911123456` (UK)
- ✅ `+919876543210` (India)
- ❌ `(415) 555-1234`
- ❌ `415-555-1234`

## Quiet Hours

Users can configure quiet hours to suppress SMS during specific times:

```json
{
  "quietHoursEnabled": true,
  "quietHoursStart": 22,
  "quietHoursEnd": 7
}
```

This will suppress SMS between 10 PM and 7 AM (local server time).

## Costs

Twilio SMS pricing varies by country. Typical costs:
- USA: ~$0.0079 per SMS segment
- International: Varies ($0.01 - $0.15 per segment)

Check current pricing at [Twilio SMS Pricing](https://www.twilio.com/sms/pricing)

## Troubleshooting

### SMS Not Sending

1. Check if Twilio is enabled: `twilio.enabled=true`
2. Verify credentials are correct
3. Ensure phone number is in E.164 format
4. Check rate limits haven't been exceeded
5. Review logs for error messages

### Verification OTP Not Received

1. Check phone number format
2. Ensure number can receive SMS
3. Check Twilio console for message status
4. Verify rate limit not exceeded (3 OTPs per hour)

### "SMS service is not available" Error

Twilio is not properly configured. Check:
1. `twilio.enabled` is `true`
2. All credentials are set correctly
3. Account has sufficient balance
