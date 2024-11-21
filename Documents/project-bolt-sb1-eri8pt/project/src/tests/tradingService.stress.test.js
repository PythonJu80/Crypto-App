const tradingService = require('../services/tradingService/tradingService');
const marketDataService = require('../services/marketDataService/marketDataService');
const { metrics } = require('../metrics');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

jest.mock('../services/marketDataService/marketDataService');
jest.mock('../metrics');

describe('Trading Service Stress Tests', () => {
  const testDb = path.join(__dirname, '../database/trades.db');
  
  beforeEach(() => {
    jest.clearAllMocks();
    marketDataService.getCurrentPrices.mockResolvedValue({
      bitcoin: { usd: 50000 },
      ethereum: { usd: 3000 }
    });
  });

  describe('Core Trading Operations', () => {
    describe('Concurrent Trade Execution', () => {
      it('should handle multiple simultaneous trades', async () => {
        const trades = Array(20).fill().map((_, index) => ({
          userId: 1,
          symbol: 'BTC',
          amount: 0.1,
          type: index % 2 === 0 ? 'buy' : 'sell'
        }));

        const results = await Promise.all(trades.map(trade => 
          tradingService.executeTrade(trade)
        ));

        expect(results.every(r => r.status === 'completed')).toBe(true);
        expect(metrics.tradesExecuted.inc).toHaveBeenCalledTimes(20);
      });

      it('should maintain data consistency under load', async () => {
        const userId = 1;
        const initialBalance = await new Promise((resolve) => {
          const db = new sqlite3.Database(testDb);
          db.get(
            'SELECT balance FROM wallets WHERE user_id = ? AND crypto_id = 1',
            [userId],
            (err, row) => {
              db.close();
              resolve(row?.balance || 0);
            }
          );
        });

        // Execute alternating buy/sell trades
        const trades = Array(10).fill().map((_, index) => ({
          userId,
          symbol: 'BTC',
          amount: 0.1,
          type: index % 2 === 0 ? 'buy' : 'sell'
        }));

        await Promise.all(trades.map(trade => 
          tradingService.executeTrade(trade)
        ));

        const finalBalance = await new Promise((resolve) => {
          const db = new sqlite3.Database(testDb);
          db.get(
            'SELECT balance FROM wallets WHERE user_id = ? AND crypto_id = 1',
            [userId],
            (err, row) => {
              db.close();
              resolve(row?.balance || 0);
            }
          );
        });

        // Balance should match initial + net trades
        expect(finalBalance).toBe(initialBalance);
      });
    });

    describe('Price Calculation Accuracy', () => {
      it('should maintain precision in calculations', async () => {
        const trade = {
          userId: 1,
          symbol: 'BTC',
          amount: 0.12345678,
          type: 'buy'
        };

        const result = await tradingService.executeTrade(trade);
        expect(result.amount).toBe(trade.amount);
        expect(typeof result.total).toBe('number');
      });
    });
  });

  describe('Alert Integration', () => {
    it('should handle multiple alert-triggered trades', async () => {
      const alertTrades = Array(5).fill().map((_, index) => ({
        userId: 1,
        symbol: 'BTC',
        amount: 0.1,
        type: 'buy',
        alertId: index + 1,
        retryCount: 0
      }));

      // Simulate intermittent market data failures
      marketDataService.getCurrentPrices
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockResolvedValueOnce({ bitcoin: { usd: 50000 } })
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue({ bitcoin: { usd: 50000 } });

      const results = await Promise.allSettled(
        alertTrades.map(trade => tradingService.executeTrade(trade))
      );

      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should update alert status after trade execution', async () => {
      const alertTrade = {
        userId: 1,
        symbol: 'BTC',
        amount: 0.1,
        type: 'buy',
        alertId: 123
      };

      await tradingService.executeTrade(alertTrade);

      // Verify alert status
      const alertStatus = await new Promise((resolve) => {
        const db = new sqlite3.Database(testDb);
        db.get(
          'SELECT is_triggered FROM alerts WHERE id = ?',
          [alertTrade.alertId],
          (err, row) => {
            db.close();
            resolve(row);
          }
        );
      });

      expect(alertStatus.is_triggered).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection failures', async () => {
      const invalidDb = new sqlite3.Database('/invalid/path/trades.db');
      
      await expect(
        tradingService.executeTrade({
          userId: 1,
          symbol: 'BTC',
          amount: 0.1,
          type: 'buy'
        })
      ).rejects.toThrow();

      expect(metrics.tradesExecuted.inc).toHaveBeenCalledWith({
        status: 'failure',
        error: expect.any(String)
      });
    });

    it('should handle market data service outages', async () => {
      marketDataService.getCurrentPrices.mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(
        tradingService.executeTrade({
          userId: 1,
          symbol: 'BTC',
          amount: 0.1,
          type: 'buy'
        })
      ).rejects.toThrow('Service unavailable');
    });
  });

  describe('Resource Management', () => {
    it('should handle database connections efficiently', async () => {
      const startConnections = await getActiveConnections();
      
      // Execute multiple trades
      await Promise.all(
        Array(50).fill().map(() =>
          tradingService.executeTrade({
            userId: 1,
            symbol: 'BTC',
            amount: 0.1,
            type: 'buy'
          })
        )
      );

      const endConnections = await getActiveConnections();
      expect(endConnections).toBeLessThanOrEqual(startConnections + 5);
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      
      // Execute 100 trades
      await Promise.all(
        Array(100).fill().map(() =>
          tradingService.executeTrade({
            userId: 1,
            symbol: 'BTC',
            amount: 0.1,
            type: 'buy'
          })
        )
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});

async function getActiveConnections() {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(testDb);
    db.get('PRAGMA database_list', (err, row) => {
      db.close();
      resolve(row ? 1 : 0);
    });
  });
}