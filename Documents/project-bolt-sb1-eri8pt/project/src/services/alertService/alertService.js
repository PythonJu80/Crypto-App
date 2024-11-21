const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const marketDataService = require('../marketDataService/marketDataService');
const notificationService = require('../notificationService/notificationService');

class AlertService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../database/trades.db');
    this.checkInterval = 60000; // Check every minute
    this.activeChecks = new Map();
  }

  /**
   * Check if a similar alert already exists
   * @private
   * @param {Object} params Alert parameters
   * @returns {Promise<boolean>} True if duplicate exists
   */
  async checkDuplicateAlert({ userId, symbol, targetPrice, condition }) {
    const db = new sqlite3.Database(this.dbPath);

    try {
      return new Promise((resolve, reject) => {
        db.get(
          `SELECT a.id FROM alerts a
           JOIN cryptocurrencies c ON a.crypto_id = c.id
           WHERE a.user_id = ? AND c.symbol = ? 
           AND a.target_price = ? AND a.condition = ?
           AND a.is_active = 1`,
          [userId, symbol, targetPrice, condition],
          (err, row) => {
            if (err) return reject(err);
            resolve(!!row);
          }
        );
      });
    } finally {
      db.close();
    }
  }

  /**
   * Verify user exists
   * @private
   * @param {number} userId User ID
   * @returns {Promise<boolean>} True if user exists
   */
  async verifyUser(userId) {
    const db = new sqlite3.Database(this.dbPath);

    try {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM users WHERE id = ?',
          [userId],
          (err, row) => {
            if (err) return reject(err);
            resolve(!!row);
          }
        );
      });
    } finally {
      db.close();
    }
  }

  /**
   * Create a new price alert
   * @param {Object} alertData Alert configuration
   * @returns {Promise<Object>} Created alert
   * @throws {Error} If duplicate alert or invalid data
   */
  async createAlert(alertData) {
    // Check for duplicate alert
    const isDuplicate = await this.checkDuplicateAlert(alertData);
    if (isDuplicate) {
      throw new Error('DUPLICATE_ALERT');
    }

    // Verify user exists
    const userExists = await this.verifyUser(alertData.userId);
    if (!userExists) {
      throw new Error('USER_NOT_FOUND');
    }

    const db = new sqlite3.Database(this.dbPath);

    try {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Get crypto_id
          db.get(
            'SELECT id FROM cryptocurrencies WHERE symbol = ?',
            [alertData.symbol],
            async (err, crypto) => {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }

              if (!crypto) {
                db.run('ROLLBACK');
                return reject(new Error('INVALID_CRYPTOCURRENCY'));
              }

              // Insert alert
              db.run(
                `INSERT INTO alerts (user_id, crypto_id, target_price, condition)
                 VALUES (?, ?, ?, ?)`,
                [alertData.userId, crypto.id, alertData.targetPrice, alertData.condition],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    return reject(err);
                  }

                  const alertId = this.lastID;
                  db.run('COMMIT', (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return reject(err);
                    }

                    resolve({
                      id: alertId,
                      ...alertData,
                      isActive: true,
                      isTriggered: false,
                      createdAt: new Date().toISOString()
                    });
                  });
                }
              );
            }
          );
        });
      });
    } finally {
      db.close();
    }
  }

  /**
   * Update alert status with concurrency check
   * @param {number} alertId Alert ID
   * @param {boolean} isActive New active status
   * @returns {Promise<Object>} Updated alert
   * @throws {Error} If alert not found or already inactive
   */
  async updateAlertStatus(alertId, isActive) {
    const db = new sqlite3.Database(this.dbPath);

    try {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Check current status
          db.get(
            'SELECT is_active FROM alerts WHERE id = ?',
            [alertId],
            (err, alert) => {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }

              if (!alert) {
                db.run('ROLLBACK');
                return reject(new Error('ALERT_NOT_FOUND'));
              }

              if (!isActive && !alert.is_active) {
                db.run('ROLLBACK');
                return reject(new Error('ALERT_ALREADY_INACTIVE'));
              }

              // Update with version check
              db.run(
                `UPDATE alerts
                 SET is_active = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND is_active = ?`,
                [isActive ? 1 : 0, alertId, alert.is_active],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    return reject(err);
                  }

                  if (this.changes === 0) {
                    db.run('ROLLBACK');
                    return reject(new Error('CONCURRENT_MODIFICATION'));
                  }

                  db.run('COMMIT', (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return reject(err);
                    }

                    resolve({ id: alertId, isActive });
                  });
                }
              );
            }
          );
        });
      });
    } finally {
      db.close();
    }
  }

  // ... rest of the service methods remain unchanged
}

module.exports = new AlertService();