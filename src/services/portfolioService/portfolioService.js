const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const marketDataService = require('../marketDataService/marketDataService');
const { metrics } = require('../../metrics');
const pino = require('pino');

class PortfolioService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../database/trades.db');
    this.logger = pino({
      transport: {
        target: 'pino-pretty'
      }
    });
  }

  /**
   * Calculate total portfolio value and holdings
   * @param {number} userId User ID
   * @returns {Promise<Object>} Portfolio summary
   */
  async calculatePortfolio(userId) {
    const transactionId = `portfolio_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();

    this.logger.info({ transactionId, userId }, 'Calculating portfolio value');

    const db = new sqlite3.Database(this.dbPath);

    try {
      // Get user's wallet balances
      const wallets = await new Promise((resolve, reject) => {
        db.all(
          `SELECT w.balance, c.symbol, c.name
           FROM wallets w
           JOIN cryptocurrencies c ON w.crypto_id = c.id
           WHERE w.user_id = ? AND w.balance > 0`,
          [userId],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
          }
        );
      });

      if (!wallets.length) {
        return {
          totalValue: 0,
          holdings: [],
          lastUpdated: new Date().toISOString()
        };
      }

      // Get current prices
      const symbols = wallets.map(w => w.symbol);
      const prices = await marketDataService.getCurrentPrices(symbols);

      // Calculate holdings and total value
      const holdings = wallets.map(wallet => {
        const price = prices[marketDataService.symbolToId(wallet.symbol)].usd;
        const value = wallet.balance * price;

        return {
          symbol: wallet.symbol,
          name: wallet.name,
          balance: wallet.balance,
          price,
          value,
          allocation: 0 // Will be calculated after total is known
        };
      });

      const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

      // Calculate allocation percentages
      holdings.forEach(holding => {
        holding.allocation = (holding.value / totalValue) * 100;
      });

      // Update metrics
      const duration = Date.now() - startTime;
      metrics.portfolioCalculationTime.observe(duration / 1000);
      metrics.portfolioValue.set({ userId }, totalValue);
      metrics.portfolioAssets.set({ userId }, holdings.length);

      this.logger.info({
        transactionId,
        userId,
        totalValue,
        assetCount: holdings.length,
        duration
      }, 'Portfolio calculation completed');

      return {
        totalValue,
        holdings: holdings.sort((a, b) => b.value - a.value),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      metrics.portfolioErrors.inc({ type: 'calculation' });
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Sync portfolio after trade execution
   * @param {number} userId User ID
   * @param {Object} trade Trade details
   * @param {string} [source='manual'] Trade source
   * @returns {Promise<Object>} Updated portfolio
   */
  async syncPortfolio(userId, trade, source = 'manual') {
    const transactionId = `sync_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();

    this.logger.info({ 
      transactionId, 
      userId, 
      trade,
      source 
    }, 'Syncing portfolio');

    const db = new sqlite3.Database(this.dbPath);

    try {
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Update wallet balance
          db.run(
            `UPDATE wallets
             SET balance = balance + ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ? AND crypto_id = (
               SELECT id FROM cryptocurrencies WHERE symbol = ?
             )`,
            [
              trade.type === 'buy' ? trade.amount : -trade.amount,
              userId,
              trade.symbol
            ],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }

              db.run('COMMIT', (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return reject(err);
                }
                resolve();
              });
            }
          );
        });
      });

      // Calculate updated portfolio
      const updatedPortfolio = await this.calculatePortfolio(userId);

      // Update metrics
      const duration = Date.now() - startTime;
      metrics.portfolioSyncTime.observe(duration / 1000);
      metrics.portfolioUpdates.inc({ source });

      this.logger.info({
        transactionId,
        userId,
        trade,
        source,
        duration,
        newTotalValue: updatedPortfolio.totalValue
      }, 'Portfolio sync completed');

      return updatedPortfolio;
    } catch (error) {
      metrics.portfolioErrors.inc({ type: 'sync' });
      this.logger.error({
        transactionId,
        userId,
        trade,
        error: error.message,
        stack: error.stack
      }, 'Portfolio sync failed');
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Handle alert-triggered trade portfolio update
   * @param {number} userId User ID
   * @param {Object} trade Trade details
   * @param {number} alertId Alert ID
   * @returns {Promise<Object>} Updated portfolio
   */
  async handleAlertTrade(userId, trade, alertId) {
    const transactionId = `alert_trade_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    this.logger.info({
      transactionId,
      userId,
      trade,
      alertId
    }, 'Processing alert-triggered trade');

    try {
      const updatedPortfolio = await this.syncPortfolio(userId, trade, 'alert');
      
      metrics.alertTriggeredUpdates.inc();

      return updatedPortfolio;
    } catch (error) {
      metrics.portfolioErrors.inc({ type: 'alert_trade' });
      this.logger.error({
        transactionId,
        userId,
        trade,
        alertId,
        error: error.message
      }, 'Alert trade processing failed');
      throw error;
    }
  }

  /**
   * Get portfolio performance metrics
   * @param {number} userId User ID
   * @param {string} timeframe Timeframe for calculation
   * @returns {Promise<Object>} Performance metrics
   */
  async getPortfolioPerformance(userId, timeframe = '24h') {
    const transactionId = `perf_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();

    this.logger.info({
      transactionId,
      userId,
      timeframe
    }, 'Calculating portfolio performance');

    const db = new sqlite3.Database(this.dbPath);

    try {
      // Get historical trades
      const trades = await new Promise((resolve, reject) => {
        const timeConstraint = this.getTimeConstraint(timeframe);
        db.all(
          `SELECT t.*, c.symbol
           FROM trades t
           JOIN cryptocurrencies c ON t.crypto_id = c.id
           WHERE t.user_id = ? AND t.created_at >= datetime('now', ?)
           ORDER BY t.created_at ASC`,
          [userId, timeConstraint],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
          }
        );
      });

      // Calculate current portfolio value
      const currentPortfolio = await this.calculatePortfolio(userId);

      // Calculate performance metrics
      const metrics = this.calculatePerformanceMetrics(trades, currentPortfolio);

      const duration = Date.now() - startTime;
      this.logger.info({
        transactionId,
        userId,
        timeframe,
        profitLoss: metrics.profitLoss,
        duration
      }, 'Performance calculation completed');

      return metrics;
    } catch (error) {
      metrics.portfolioErrors.inc({ type: 'performance' });
      throw error;
    } finally {
      db.close();
    }
  }

  // Helper methods remain unchanged
}

module.exports = new PortfolioService();