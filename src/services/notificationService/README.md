# Notification Service

This service handles sending notifications through various channels (email, webhooks) when price alerts are triggered in the crypto trading application.

## Features

- Email notifications using Nodemailer
- Webhook notifications for external integrations
- Customizable notification templates
- Retry logic for failed notifications
- Comprehensive logging

## Usage

```javascript
const notificationService = require('./notificationService');

// Send email notification
await notificationService.sendEmail({
  to: 'user@example.com',
  subject: 'Price Alert',
  text: 'Your alert has been triggered',
  html: '<p>Your alert has been triggered</p>'
});

// Register webhook
notificationService.registerWebhook(userId, 'https://example.com/webhook');

// Send webhook notification
await notificationService.sendWebhook(userId, {
  type: 'alert_triggered',
  data: { /* alert data */ }
});

// Send alert notification through all channels
await notificationService.sendAlertNotification(alert, user, currentPrice);
```

## API Methods

### sendEmail(params)
Send an email notification.

Parameters:
- `to`: Recipient email address
- `subject`: Email subject
- `text`: Plain text content
- `html`: HTML content

```javascript
await notificationService.sendEmail({
  to: 'user@example.com',
  subject: 'Alert Triggered',
  text: 'Your BTC price alert has been triggered',
  html: '<p>Your BTC price alert has been triggered</p>'
});
```

### registerWebhook(userId, url)
Register a webhook URL for a user.

```javascript
notificationService.registerWebhook('123', 'https://example.com/webhook');
```

### sendWebhook(userId, data)
Send a notification to a registered webhook.

```javascript
await notificationService.sendWebhook('123', {
  alertId: 1,
  symbol: 'BTC',
  price: 50000
});
```

### sendAlertNotification(alert, user, currentPrice)
Send notifications through all configured channels.

```javascript
await notificationService.sendAlertNotification(
  alertData,
  userData,
  50000
);
```

## Configuration

### Email Settings
Configure in environment variables:
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user
SMTP_PASS=password
EMAIL_FROM=alerts@example.com
```

## Error Handling

The service includes comprehensive error handling for:
- SMTP connection issues
- Webhook delivery failures
- Invalid configurations
- Network errors

## Logging

Uses Pino for structured logging:
- Success/failure of notifications
- Webhook registrations
- Error details
- Performance metrics

## Testing

Run tests using:
```bash
npm test
```

## Dependencies

- nodemailer: Email sending
- axios: HTTP client for webhooks
- pino: Logging