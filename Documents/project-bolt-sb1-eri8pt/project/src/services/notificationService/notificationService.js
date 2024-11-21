const nodemailer = require('nodemailer');
const axios = require('axios');
const pino = require('pino');
const { WebSocket } = require('ws');

class NotificationService {
  constructor() {
    this.logger = pino({
      transport: {
        target: 'pino-pretty'
      }
    });

    this.wsClients = new Set();
    this.emailTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Add WebSocket client
   * @param {WebSocket} client WebSocket client
   */
  addClient(client) {
    this.wsClients.add(client);
    this.logger.info('New WebSocket client connected');

    client.on('close', () => {
      this.wsClients.delete(client);
      this.logger.info('WebSocket client disconnected');
    });
  }

  /**
   * Broadcast notification to all connected clients
   * @param {Object} notification Notification data
   */
  broadcast(notification) {
    const payload = JSON.stringify({
      type: 'notification',
      data: notification
    });

    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  /**
   * Handle trade execution notification
   * @param {Object} trade Trade details
   */
  async handleTradeNotification(trade) {
    const notification = {
      type: 'trade',
      title: 'Trade Executed',
      message: `Successfully ${trade.type} ${trade.amount} ${trade.symbol} at ${trade.price}`,
      timestamp: new Date().toISOString(),
      data: trade
    };

    // Broadcast to WebSocket clients
    this.broadcast(notification);

    // Send email if configured
    if (trade.user?.email) {
      await this.sendEmail({
        to: trade.user.email,
        subject: 'Trade Execution Confirmation',
        text: this.createTradeEmailText(trade),
        html: this.createTradeEmailHtml(trade)
      });
    }

    this.logger.info({ trade }, 'Trade notification sent');
  }

  /**
   * Handle alert trigger notification
   * @param {Object} alert Alert details
   * @param {number} currentPrice Current price that triggered alert
   */
  async handleAlertNotification(alert, currentPrice) {
    const notification = {
      type: 'alert',
      title: 'Price Alert Triggered',
      message: `${alert.symbol} price ${alert.condition} ${alert.targetPrice} (Current: ${currentPrice})`,
      timestamp: new Date().toISOString(),
      data: { alert, currentPrice }
    };

    // Broadcast to WebSocket clients
    this.broadcast(notification);

    // Send email if configured
    if (alert.user?.email) {
      await this.sendEmail({
        to: alert.user.email,
        subject: 'Price Alert Triggered',
        text: this.createAlertEmailText(alert, currentPrice),
        html: this.createAlertEmailHtml(alert, currentPrice)
      });
    }

    this.logger.info({ alert, currentPrice }, 'Alert notification sent');
  }

  /**
   * Handle error notification
   * @param {Error} error Error object
   * @param {string} context Error context
   */
  async handleErrorNotification(error, context) {
    const notification = {
      type: 'error',
      title: 'System Error',
      message: `Error in ${context}: ${error.message}`,
      timestamp: new Date().toISOString(),
      data: { error: error.message, context }
    };

    // Broadcast to WebSocket clients
    this.broadcast(notification);

    this.logger.error({ error, context }, 'Error notification sent');
  }

  /**
   * Send email notification
   * @private
   */
  async sendEmail({ to, subject, text, html }) {
    try {
      await this.emailTransport.sendMail({
        from: process.env.EMAIL_FROM || 'crypto-alerts@example.com',
        to,
        subject,
        text,
        html
      });

      this.logger.info({ to, subject }, 'Email notification sent');
    } catch (error) {
      this.logger.error({ error, to, subject }, 'Failed to send email');
      throw error;
    }
  }

  /**
   * Create trade email text content
   * @private
   */
  createTradeEmailText(trade) {
    return `
Trade Execution Confirmation

Type: ${trade.type.toUpperCase()}
Symbol: ${trade.symbol}
Amount: ${trade.amount}
Price: $${trade.price}
Total Value: $${trade.amount * trade.price}
Time: ${new Date().toLocaleString()}

Visit your dashboard for more details.
    `.trim();
  }

  /**
   * Create trade email HTML content
   * @private
   */
  createTradeEmailHtml(trade) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #00FF00; color: #000; padding: 20px; border-radius: 5px; }
    .details { margin: 20px 0; }
    .value { font-size: 24px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Trade Execution Confirmation</h2>
    </div>
    <div class="details">
      <p><strong>Type:</strong> ${trade.type.toUpperCase()}</p>
      <p><strong>Symbol:</strong> ${trade.symbol}</p>
      <p><strong>Amount:</strong> ${trade.amount}</p>
      <p><strong>Price:</strong> $${trade.price}</p>
      <p><strong>Total Value:</strong> $${trade.amount * trade.price}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>
    <p><a href="#">Visit your dashboard</a> for more details.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Create alert email text content
   * @private
   */
  createAlertEmailText(alert, currentPrice) {
    return `
Price Alert Triggered!

Symbol: ${alert.symbol}
Condition: Price ${alert.condition} ${alert.targetPrice}
Current Price: ${currentPrice}
Time: ${new Date().toLocaleString()}

Visit your dashboard to manage your alerts.
    `.trim();
  }

  /**
   * Create alert email HTML content
   * @private
   */
  createAlertEmailHtml(alert, currentPrice) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FFD700; color: #000; padding: 20px; border-radius: 5px; }
    .details { margin: 20px 0; }
    .price { font-size: 24px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Price Alert Triggered!</h2>
    </div>
    <div class="details">
      <p><strong>Symbol:</strong> ${alert.symbol}</p>
      <p><strong>Condition:</strong> Price ${alert.condition} ${alert.targetPrice}</p>
      <p><strong>Current Price:</strong> <span class="price">${currentPrice}</span></p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>
    <p><a href="#">Visit your dashboard</a> to manage your alerts.</p>
  </div>
</body>
</html>
    `.trim();
  }
}

module.exports = new NotificationService();