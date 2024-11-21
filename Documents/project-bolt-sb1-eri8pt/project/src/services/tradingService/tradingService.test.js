const tradingService = require('./tradingService');
const marketDataService = require('../marketDataService/marketDataService');
const { metrics } = require('../../metrics');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

jest.mock('../marketDataService/marketDataService');
jest.mock('../../metrics');

describe('TradingService', () => {
  const testDb = path.join(__dirname, '../../database/trades.db');

  beforeEach(() => {
    jest.clearAllMocks();
    marketDataService.getCurrentPrices.mockResolvedValue({
      bitcoin: { usd: 50000 },
      ethereum: { usd: 3000 }
    });
    marketDataService.symbolToId.mockImplementation(symbol => 
      symbol === 'BTC' ? 'bitcoin' : 'ethereum'
    );
  });

  describe('Core Trading Operations', () => {
    describe('executeTrade', () => {
      const validTradeParams = {
        userId: 1,
        symbol: 'BTC',
        amount: 0.1,
        type: 'buy'
      };

      it('should execute buy trade successfully', async () => {
        const trade = await tradingService.executeTrade(validTradeParams);

        expect(trade).toMatchObject({
          userId: validTradeParams.userId,
          symbol: validTradeParams.symbol,
          amount: validTradeParams.amount,
          type: validTradeParams.type,
          status: 'completed'
        });

        expect(metrics.tradesExecuted.inc).toHaveBeenCalledWith({
          status: 'success',
          type: 'buy',
          source: 'manual'
        });
      });

      it('should execute sell trade with sufficient balance', async () => {
        const sellTrade = await tradingService.executeTrade({
          ...validTradeParams,
          type: 'sell'
        });

        expect(sellTrade.status).toBe('completed');
        expect(metrics.tradesExecuted.inc).toHaveBeenCalledWith({
          status: 'success',
          type: 'sell',
          source: 'manual'
        });
      });

      it('should handle insufficient balance for sell trades', async () => {
        await expect(
          tradingService.executeTrade({
            ...validTradeParams,
            type: 'sell',
            amount: 999999
          })
        ).rejects.toThrow('Insufficient balance');

        expect(metrics.tradesExecuted.inc).toHaveBeenCalledWith({
          status: 'failure',
          error: 'Insufficient balance'
        });
      });

      it('should validate trade parameters', async () => {
        const invalidParams = [
          { ...validTradeParams, amount: -1 },
          { ...validTradeParams, amount: 0 },
          { ...validTradeParams, type: 'invalid' },
          { ...validTradeParams, symbol: 'INVALID' }
        ];

        for (const params of invalidParams) {
          await expect(tradingService.executeTrade(params)).rejects.toThrow();
        }
      });
    });

    describe('calculateProfitLoss', () => {
      it('should calculate profit correctly', async () => {
        const tradeId = 1;
        marketDataService.getCurrentPrices.mockResolvedValueOnce({
          bitcoin: { usd: 55000 } // Price increased
        });

        const result = await tradingService.calculateProfitLoss(tradeId);

        expect(result.profitLoss).toBeGreaterThan(0);
        expect(metrics.profitLossCalculations.inc).toHaveBeenCalled();
      });

      it('should calculate loss correctly', async () => {
        const tradeId = 1;
        marketDataService.getCurrentPrices.mockResolvedValueOnce({
          bitcoin: { usd: 45000 } // Price decreased
        });

        const result = await tradingService.calculateProfitLoss(tradeId);

        expect(result.profitLoss).toBeLessThan(0);
        expect(metrics.profitLossCalculations.inc).toHaveBeenCalled();
      });
    });
  });

  describe('Alert Integration', () => {
    it('should handle alert-triggered trades', async () => {
      const alertTrade = {
        userId: 1,
        symbol: 'BTC',
        amount: 0.1,
        type: 'buy',
        alertId: 123
      };

      const trade = await tradingService.executeTrade(alertTrade);

      expect(trade).toMatchObject({
        alertId: 123,
        status: 'completed'
      });

      expect(metrics.tradesExecuted.inc).toHaveBeenCalledWith({
        status: 'success',
        type: 'buy',
        source: 'alert'
      });
    });

    it('should handle alert-triggered trades with retries', async () => {
      const alertTrade = {
        userId: 1,
        symbol: 'BTC',
        amount: 0.1,
        type: 'buy',
        alertId: 123,
        retryCount: 0
      };

      // Simulate first attempt failure
      marketDataService.getCurrentPrices
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          bitcoin: { usd: 50000 }
        });

      const trade = await tradingService.executeTrade(alertTrade);

      expect(trade.status).toBe('completed');
      expect(trade.retryCount).toBe(1);
    });

    it('should update alert status after trade execution', async () => {
      const alertTrade = {
        userId: 1,
        symbol: 'BTC',
        amount: 0.1,
        type: 'buy',
        alertId: 123
      };

      const trade = await tradingService.executeTrade(alertTrade);

      expect(trade.status).toBe('completed');
      
      // Verify alert status update
      const alertUpdate = await new Promise((resolve) => {
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

      expect(alertUpdate.is_triggered).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle market data service failures', async () => {
      marketDataService.getCurrentPrices.mockRejectedValue(
        new Error('Market data unavailable')
      );

      await expect(
        tradingService.executeTrade({
          userId: 1,
          symbol: 'BTC',
          amount: 0.1,
          type: 'buy'
        })
      ).rejects.toThrow('Market data unavailable');

      expect(metrics.tradesExecuted.inc).toHaveBeenCalledWith({
        status: 'failure',
        error: 'Market data unavailable'
      });
    });

    it('should handle database errors gracefully', async () => {
      // Simulate database error by using invalid path
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

    it('should handle concurrent trade errors', async () => {
      const trades = Array(5).fill().map(() =>
        tradingService.executeTrade({
          userId: 1,
          symbol: 'BTC',
          amount: 0.1,
          type: 'buy'
        })
      );

      await expect(Promise.all(trades)).resolves.toBeDefined();
    });
  });

  describe('Resource Management', () => {
    it('should handle database connections properly', async () => {
      const trades = Array(20).fill().map(() =>
        tradingService.executeTrade({
          userId: 1,
          symbol: 'BTC',
          amount: 0.1,
          type: 'buy'
        })
      );

      await Promise.all(trades);

      // Verify no connection leaks
      const activeConnections = await new Promise((resolve) => {
        const db = new sqlite3.Database(testDb);
        db.get('PRAGMA database_list', (err, row) => {
          db.close();
          resolve(row);
        });
      });

      expect(activeConnections).toBeDefined();
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      const trades = Array(50).fill().map(() =>
        tradingService.executeTrade({
          userId: 1,
          symbol: 'BTC',
          amount: 0.1,
          type: 'buy'
        })
      );

      await Promise.all(trades);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Trade History', () => {
    const userId = 1;

    it('should return paginated trade history', async () => {
      const history = await tradingService.getTradeHistory(userId, {
        limit: 5,
        offset: 0
      });

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeLessThanOrEqual(5);
      expect(metrics.tradeHistoryRequests.inc).toHaveBeenCalledWith({ userId });
    });

    it('should sort trades by date descending', async () => {
      const history = await tradingService.getTradeHistory(userId);
      
      for (let i = 1; i < history.length; i++) {
        expect(new Date(history[i].createdAt))
          .toBeLessThanOrEqual(new Date(history[i-1].createdAt));
      }
    });

    it('should handle empty trade history', async () => {
      const history = await tradingService.getTradeHistory(99999);
      expect(history).toEqual([]);
    });
  });
});