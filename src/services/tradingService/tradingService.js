const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const marketDataService = require('../marketDataService/marketDataService');
const pino = require('pino');
const { metrics } = require('../../metrics');

class TradingService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../database/trades.db');
    this.logger = pino({
      transport: {
        target: 'pino-pretty'
      }
    });
  }

  /**
   * Execute a trade
   * @param {Object} tradeParams Trade parameters
   * @param {number} tradeParams.userId User ID
   * @param {string} tradeParams.symbol Cryptocurrency symbol
   * @param {number} tradeParams.amount Amount to trade
   * @param {string} tradeParams.type Trade type ('buy' or 'sell')
   * @param {number} [tradeParams.alertId] Optional alert ID that triggered the trade
   * @returns {Promise<Object>} Trade details
   */
  async executeTrade({ userId, symbol, amount, type, alertId = null }) {
    const transactionId = `trade_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();

    this.logger.info({
      transactionId,
      userId,
      symbol,
      amount,
      type,
      alertId
    }, 'Starting trade execution');

    const db = new sqlite3.Database(this.dbPath);

    try {
      // Get current price
      const priceData = await marketDataService.getCurrentPrices([symbol]);
      const currentPrice = priceData[marketDataService.symbolToId(symbol)].usd;
      const totalValue = amount * currentPrice;

      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Get crypto_id
          db.get(
            'SELECT id FROM cryptocurrencies WHERE symbol = ?',
            [symbol],
            async (err, crypto) => {
              if (err) {
                db.run('ROLLBACK');
                this.logTradeError(transactionId, 'Database error', err);
                return reject(err);
              }

              if (!crypto) {
                db.run('ROLLBACK');
                this.logTradeError(transactionId, 'Invalid cryptocurrency');
                return reject(new Error('Invalid cryptocurrency'));
              }

              // Check wallet balance for sells
              if (type === 'sell') {
                db.get(
                  'SELECT balance FROM wallets WHERE user_id = ? AND crypto_id = ?',
                  [userId, crypto.id],
                  (err, wallet) => {
                    if (err || !wallet || wallet.balance < amount) {
                      db.run('ROLLBACK');
                      this.logTradeError(transactionId, 'Insufficient balance');
                      return reject(new Error('Insufficient balance'));
                    }
                  }
                );
              }

              // Insert trade with alert_id if present
              db.run(
                `INSERT INTO trades (user_id, crypto_id, trade_type, amount, price, total_value, status, alert_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, crypto.id, type, amount, currentPrice, totalValue, 'completed', alertId],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    this.logTradeError(transactionId, 'Failed to insert trade', err);
                    return reject(err);
                  }

                  const tradeId = this.lastID;

                  // Update wallet
                  const balanceChange = type === 'buy' ? amount : -amount;
                  db.run(
                    `INSERT INTO wallets (user_id, crypto_id, balance)
                     VALUES (?, ?, ?)
                     ON CONFLICT(user_id, crypto_id) DO UPDATE SET
                     balance = balance + ?`,
                    [userId, crypto.id, balanceChange, balanceChange],
                    (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        this.logTradeError(transactionId, 'Failed to update wallet', err);
                        return reject(err);
                      }

                      db.run('COMMIT', (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          this.logTradeError(transactionId, 'Failed to commit transaction', err);
                          return reject(err);
                        }

                        const executionTime = Date.now() - startTime;
                        metrics.tradeExecutionTime.observe(executionTime / 1000);
                        metrics.tradesExecuted.inc({
                          status: 'success',
                          type,
                          source: alertId ? 'alert' : 'manual'
                        });

                        this.logger.info({
                          transactionId,
                          tradeId,
                          executionTime
                        }, 'Trade executed successfully');

                        resolve({
                          id: tradeId,
                          userId,
                          symbol,
                          type,
                          amount,
                          price: currentPrice,
                          totalValue,
                          status: 'completed',
                          alertId,
                          executionTime
                        });
                      });
                    }
                  );
                }
              );
            }
          );
        });
      });
    } catch (error) {
      this.logTradeError(transactionId, 'Unexpected error during trade execution', error);
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Log trade error with consistent format
   * @private
   */
  logTradeError(transactionId, message, error = null) {
    this.logger.error({
      transactionId,
      error: error?.message || message,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    }, message);

    metrics.tradesExecuted.inc({
      status: 'failure',
      error: error?.message || message
    });
  }

  /**
   * Calculate profit/loss for a specific trade
   * @param {number} tradeId Trade ID
   * @returns {Promise<Object>} Profit/loss details
   */
  async calculateProfitLoss(tradeId) {
    const transactionId = `pl_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.logger.info({ transactionId, tradeId }, 'Calculating profit/loss');

    const db = new sqlite3.Database(this.dbPath);

    try {
      return new Promise((resolve, reject) => {
        db.get(
          `SELECT t.*, c.symbol
           FROM trades t
           JOIN cryptocurrencies c ON t.crypto_id = c.id
           WHERE t.id = ?`,
          [tradeId],
          async (err, trade) => {
            if (err) {
              this.logger.error({
                transactionId,
                tradeId,
                error: err.message
              }, 'Database error during profit/loss calculation');
              return reject(err);
            }

            if (!trade) {
              this.logger.warn({
                transactionId,
                tradeId
              }, 'Trade not found');
              return reject(new Error('Trade not found'));
            }

            try {
              const currentPriceData = await marketDataService.getCurrentPrices([trade.symbol]);
              const currentPrice = currentPriceData[marketDataService.symbolToId(trade.symbol)].usd;

              const profitLoss = trade.trade_type === 'buy'
                ? (currentPrice - trade.price) * trade.amount
                : (trade.price - currentPrice) * trade.amount;

              const percentageChange = (profitLoss / trade.total_value) * 100;

              metrics.profitLossCalculations.inc();
              metrics.profitLossValues.observe(profitLoss);

              this.logger.info({
                transactionId,
                tradeId,
                profitLoss,
                percentageChange
              }, 'Profit/loss calculated successfully');

              resolve({
                tradeId,
                symbol: trade.symbol,
                entryPrice: trade.price,
                currentPrice,
                profitLoss,
                percentageChange,
                type: trade.trade_type
              });
            } catch (error) {
              this.logger.error({
                transactionId,
                tradeId,
                error: error.message
              }, 'Failed to calculate profit/loss');
              reject(error);
            }
          }
        );
      });
    } finally {
      db.close();
    }
  }

  /**
   * Get trade history for a user
   * @param {number} userId User ID
   * @param {Object} options Query options
   * @returns {Promise<Array>} Trade history
   */
  async getTradeHistory(userId, { limit = 10, offset = 0 } = {}) {
    const transactionId = `history_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.logger.info({ transactionId, userId }, 'Fetching trade history');

    const db = new sqlite3.Database(this.dbPath);

    try {
      return new Promise((resolve, reject) => {
        db.all(
          `SELECT t.*, c.symbol
           FROM trades t
           JOIN cryptocurrencies c ON t.crypto_id = c.id
           WHERE t.user_id = ?
           ORDER BY t.created_at DESC
           LIMIT ? OFFSET ?`,
          [userId, limit, offset],
          (err, trades) => {
            if (err) {
              this.logger.error({
                transactionId,
                userId,
                error: err.message
              }, 'Failed to fetch trade history');
              return reject(err);
            }

            metrics.tradeHistoryRequests.inc({ userId });

            this.logger.info({
              transactionId,
              userId,
              tradeCount: trades.length
            }, 'Trade history fetched successfully');

            resolve(trades.map(trade => ({
              id: trade.id,
              symbol: trade.symbol,
              type: trade.trade_type,
              amount: trade.amount,
              price: trade.price,
              totalValue: trade.total_value,
              status: trade.status,
              createdAt: trade.created_at,
              alertId: trade.alert_id
            })));
          }
        );
      });
    } finally {
      db.close();
    }
  }
}

module.exports = new TradingService();