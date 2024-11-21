const notificationService = require('./notificationService');
const nodemailer = require('nodemailer');
const axios = require('axios');
const pino = require('pino');

jest.mock('nodemailer');
jest.mock('axios');
jest.mock('pino');

describe('NotificationService', () => {
  const mockTransport = {
    sendMail: jest.fn()
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    nodemailer.createTransport.mockReturnValue(mockTransport);
    pino.mockReturnValue(mockLogger);
  });

  describe('Email Notifications', () => {
    const validEmailParams = {
      to: 'user@example.com',
      subject: 'Test Alert',
      text: 'Test content',
      html: '<p>Test content</p>'
    };

    it('should send email successfully', async () => {
      mockTransport.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 Message accepted'
      });

      const result = await notificationService.sendEmail(validEmailParams);

      expect(result).toBe(true);
      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining(validEmailParams)
      );
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle invalid email addresses', async () => {
      const invalidEmailParams = {
        ...validEmailParams,
        to: 'invalid-email'
      };

      mockTransport.sendMail.mockRejectedValue(
        new Error('Invalid email address')
      );

      await expect(notificationService.sendEmail(invalidEmailParams))
        .rejects
        .toThrow('Failed to send email: Invalid email address');
      
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle SMTP connection errors', async () => {
      mockTransport.sendMail.mockRejectedValue(
        new Error('SMTP connection failed')
      );

      await expect(notificationService.sendEmail(validEmailParams))
        .rejects
        .toThrow('Failed to send email: SMTP connection failed');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error)
        }),
        'Failed to send email notification'
      );
    });

    it('should handle email timeout', async () => {
      mockTransport.sendMail.mockRejectedValue(
        new Error('Operation timed out')
      );

      await expect(notificationService.sendEmail(validEmailParams))
        .rejects
        .toThrow('Failed to send email: Operation timed out');
    });

    it('should validate email parameters', async () => {
      const incompleteParams = {
        to: 'user@example.com'
        // Missing subject and content
      };

      await expect(notificationService.sendEmail(incompleteParams))
        .rejects
        .toThrow();
    });
  });

  describe('Webhook Notifications', () => {
    const userId = '123';
    const webhookUrl = 'https://example.com/webhook';
    const validPayload = {
      alertId: 1,
      symbol: 'BTC',
      price: 50000
    };

    beforeEach(() => {
      notificationService.registerWebhook(userId, webhookUrl);
    });

    it('should send webhook successfully', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: { success: true }
      });

      const result = await notificationService.sendWebhook(userId, validPayload);

      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        webhookUrl,
        expect.objectContaining({
          type: 'alert_triggered',
          data: validPayload
        })
      );
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle server unreachable', async () => {
      axios.post.mockRejectedValue(
        new Error('ECONNREFUSED')
      );

      await expect(notificationService.sendWebhook(userId, validPayload))
        .rejects
        .toThrow('Failed to send webhook: ECONNREFUSED');
      
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle timeout', async () => {
      axios.post.mockRejectedValue(
        new Error('Request timeout')
      );

      await expect(notificationService.sendWebhook(userId, validPayload))
        .rejects
        .toThrow('Failed to send webhook: Request timeout');
    });

    it('should handle non-200 response', async () => {
      axios.post.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      });

      await expect(notificationService.sendWebhook(userId, validPayload))
        .rejects
        .toThrow('Failed to send webhook');
    });

    it('should skip notification for unregistered webhook', async () => {
      const result = await notificationService.sendWebhook('unknown', validPayload);
      
      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'unknown' }),
        'No webhook URL configured for user'
      );
    });

    it('should handle webhook registration and unregistration', () => {
      notificationService.registerWebhook(userId, webhookUrl);
      expect(notificationService.webhooks.get(userId)).toBe(webhookUrl);

      notificationService.unregisterWebhook(userId);
      expect(notificationService.webhooks.get(userId)).toBeUndefined();
    });
  });

  describe('Alert Notifications', () => {
    const alert = {
      id: 1,
      symbol: 'BTC',
      targetPrice: 50000,
      condition: 'above'
    };

    const user = {
      id: '123',
      email: 'user@example.com'
    };

    const currentPrice = 51000;

    it('should send notifications through all channels successfully', async () => {
      mockTransport.sendMail.mockResolvedValue(true);
      axios.post.mockResolvedValue({ status: 200 });
      notificationService.registerWebhook(user.id, 'https://example.com/webhook');

      const results = await notificationService.sendAlertNotification(
        alert,
        user,
        currentPrice
      );

      expect(results).toEqual({
        email: true,
        webhook: true
      });
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle partial channel failures', async () => {
      mockTransport.sendMail.mockRejectedValue(new Error('SMTP error'));
      axios.post.mockResolvedValue({ status: 200 });
      notificationService.registerWebhook(user.id, 'https://example.com/webhook');

      await expect(
        notificationService.sendAlertNotification(alert, user, currentPrice)
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle missing user email', async () => {
      const userWithoutEmail = { id: '123' };
      axios.post.mockResolvedValue({ status: 200 });
      notificationService.registerWebhook(userWithoutEmail.id, 'https://example.com/webhook');

      const results = await notificationService.sendAlertNotification(
        alert,
        userWithoutEmail,
        currentPrice
      );

      expect(results.email).toBe(false);
      expect(results.webhook).toBe(true);
    });

    it('should validate notification data', async () => {
      const invalidAlert = {
        // Missing required fields
      };

      await expect(
        notificationService.sendAlertNotification(invalidAlert, user, currentPrice)
      ).rejects.toThrow();
    });

    it('should format email content correctly', () => {
      const data = {
        symbol: 'BTC',
        targetPrice: 50000,
        currentPrice: 51000,
        condition: 'above',
        triggeredAt: '2023-12-15T12:00:00Z'
      };

      const text = notificationService.createEmailText(data);
      const html = notificationService.createEmailHtml(data);

      expect(text).toContain(data.symbol);
      expect(text).toContain(data.targetPrice.toString());
      expect(html).toContain('Price Alert Triggered!');
      expect(html).toContain(data.currentPrice.toString());
    });
  });
});