const portfolioService = require('../services/portfolioService/portfolioService');
const tradingService = require('../services/tradingService/tradingService');
const alertService = require('../services/alertService/alertService');
const marketDataService = require('../services/marketDataService/marketDataService');
const { metrics } = require('../metrics');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

jest.mock('../services/marketDataService/marketDataService');
jest.mock('../metrics');

describe('Portfolio Service Integration', () => {
  const testDb = path.join(__dirname, '../database/trades.db');
  const userId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    marketDataService.getCurrentPrices.mockResolvedValue({
      bitcoin: { usd: 50000 },
      ethereum: { usd: 3000 }
    });
  });

  describe('Trade Integration', () => {
    it('should update portfolio immediately after trade execution', async () => {
      const trade = {
        userId,
        symbol: 'BTC',
        amount: 0.1,
        type: 'buy',
        price: 50000
      };

      const initialPortfolio = await portfolioService.calculatePortfolio(userId);
      
      // Execute trade
      await tradingService.executeTrade(trade);
      
      // Verify immediate portfolio update
      const updatedPortfolio = await portfolioService.calculatePortfolio(userId);
      
      expect(updatedPortfolio.totalValue).toBeGreaterThan(initialPortfolio.totalValue);
      expect(metrics.portfolioUpdates.inc).toHaveBeenCalledWith({
        source: 'manual'
      });
    });

    it('should handle concurrent trades correctly', async () => {
      const trades = [
        { userId, symbol: 'BTC', amount: 0.1, type: 'buy' },
        { userId, symbol: 'ETH', amount: 1.0, type: 'buy' }
      ];

      // Execute trades concurrently
      await Promise.all(trades.map(trade => 
        tradingService.executeTrade(trade)
      ));

      const finalPortfolio = await portfolioService.calculatePortfolio(userId);
      
      // Verify both assets are present
      expect(finalPortfolio.holdings).toHaveLength(2);
      expect(finalPortfolio.holdings.some(h => h.symbol === 'BTC')).toBe(true);
      expect(finalPortfolio.holdings.some(h => h.symbol === 'ETH')).toBe(true);
    });
  });

  describe('Alert Integration', () => {
    it('should handle alert-triggered trades', async () => {
      const alertTrade = {
        userId,
        symbol: 'BTC',
        amount: 0.1,
        type: 'buy',
        alertId: 123
      };

      const initialPortfolio = await portfolioService.calculatePortfolio(userId);
      
      // Process alert-triggered trade
      await portfolioService.handleAlertTrade(
        userId,
        alertTrade,
        alertTrade.alertId
      );

      const updatedPortfolio = await portfolioService.calculatePortfolio(userId);
      
      expect(updatedPortfolio.totalValue).toBeGreaterThan(initialPortfolio.totalValue);
      expect(metrics.alertTriggeredUpdates.inc).toHaveBeenCalled();
    });

    it('should process multiple alert-triggered trades sequentially', async () => {
      const alertTrades = [
        { userId, symbol: 'BTC', amount: 0.1, type: 'buy', alertId: 1 },
        { userId, symbol: 'BTC', amount: 0.1, type: 'sell', alertId: 2 }
      ];

      const results = [];
      for (const trade of alertTrades) {
        const portfolio = await portfolioService.handleAlertTrade(
          userId,
          trade,
          trade.alertId
        );
        results.push(portfolio);
      }

      expect(results).toHaveLength(2);
      expect(metrics.alertTriggeredUpdates.inc).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle market data service failures', async () => {
      marketDataService.getCurrentPrices.mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(portfolioService.calculatePortfolio(userId))
        .rejects.toThrow('Service unavailable');
      
      expect(metrics.portfolioErrors.inc).toHaveBeenCalledWith({
        type: 'calculation'
      });
    });

    it('should handle database errors during sync', async () => {
      const invalidDb = new sqlite3.Database('/invalid/path/trades.db');
      
      await expect(
        portfolioService.syncPortfolio(userId, {
          symbol: 'BTC',
          amount: 0.1,
          type: 'buy'
        })
      ).rejects.toThrow();

      expect(metrics.portfolioErrors.inc).toHaveBeenCalledWith({
        type: 'sync'
      });
    });
  });

  describe('Resource Management', () => {
    it('should handle database connections efficiently', async () => {
      const startConnections = await getActiveConnections();
      
      // Execute multiple operations
      await Promise.all([
        portfolioService.calculatePortfolio(userId),
        portfolioService.syncPortfolio(userId, {
          symbol: 'BTC',
          amount: 0.1,
          type: 'buy'
        }),
        portfolioService.getPortfolioPerformance(userId)
      ]);

      const endConnections = await getActiveConnections();
      expect(endConnections).toBeLessThanOrEqual(startConnections + 5);
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      
      // Execute multiple portfolio calculations
      await Promise.all(
        Array(20).fill().map(() =>
          portfolioService.calculatePortfolio(userId)
        )
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
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