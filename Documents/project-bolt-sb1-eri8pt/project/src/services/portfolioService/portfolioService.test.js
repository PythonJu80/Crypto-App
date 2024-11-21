const portfolioService = require('./portfolioService');
const marketDataService = require('../marketDataService/marketDataService');
const { metrics } = require('../../metrics');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

jest.mock('../marketDataService/marketDataService');
jest.mock('../../metrics');

describe('PortfolioService', () => {
  const testDb = path.join(__dirname, '../../database/trades.db');
  const userId = 1;

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

  describe('calculatePortfolio', () => {
    it('should calculate portfolio value correctly', async () => {
      const portfolio = await portfolioService.calculatePortfolio(userId);

      expect(portfolio).toHaveProperty('totalValue');
      expect(portfolio).toHaveProperty('holdings');
      expect(portfolio.holdings).toBeInstanceOf(Array);
      expect(metrics.portfolioValue.set).toHaveBeenCalled();
    });

    it('should handle empty portfolio', async () => {
      const emptyUserId = 999;
      const portfolio = await portfolioService.calculatePortfolio(emptyUserId);

      expect(portfolio.totalValue).toBe(0);
      expect(portfolio.holdings).toHaveLength(0);
    });

    it('should calculate allocation percentages correctly', async () => {
      const portfolio = await portfolioService.calculatePortfolio(userId);

      const totalAllocation = portfolio.holdings.reduce(
        (sum, holding) => sum + holding.allocation,
        0
      );
      expect(Math.round(totalAllocation)).toBe(100);
    });
  });

  describe('syncPortfolio', () => {
    const trade = {
      symbol: 'BTC',
      amount: 0.1,
      type: 'buy',
      price: 50000
    };

    it('should update portfolio after trade', async () => {
      const initialPortfolio = await portfolioService.calculatePortfolio(userId);
      const updatedPortfolio = await portfolioService.syncPortfolio(userId, trade);

      expect(updatedPortfolio.totalValue).toBeGreaterThan(0);
      const btcHolding = updatedPortfolio.holdings.find(h => h.symbol === 'BTC');
      expect(btcHolding).toBeDefined();
    });

    it('should handle trade reversals correctly', async () => {
      // Buy then sell
      const buyTrade = { ...trade, type: 'buy' };
      const sellTrade = { ...trade, type: 'sell' };

      await portfolioService.syncPortfolio(userId, buyTrade);
      const finalPortfolio = await portfolioService.syncPortfolio(userId, sellTrade);

      const btcHolding = finalPortfolio.holdings.find(h => h.symbol === 'BTC');
      expect(btcHolding?.balance).toBe(0);
    });
  });

  describe('getPortfolioPerformance', () => {
    it('should calculate performance metrics', async () => {
      const performance = await portfolioService.getPortfolioPerformance(userId);

      expect(performance).toHaveProperty('profitLoss');
      expect(performance).toHaveProperty('profitLossPercentage');
      expect(performance).toHaveProperty('tradeCount');
      expect(performance).toHaveProperty('volume');
    });

    it('should handle different timeframes', async () => {
      const timeframes = ['24h', '7d', '30d', '1y'];
      
      for (const timeframe of timeframes) {
        const performance = await portfolioService.getPortfolioPerformance(
          userId,
          timeframe
        );
        expect(performance).toBeDefined();
      }
    });

    it('should identify best and worst performing assets', async () => {
      const performance = await portfolioService.getPortfolioPerformance(userId);

      if (performance.tradeCount > 0) {
        expect(performance.bestPerforming).toBeDefined();
        expect(performance.worstPerforming).toBeDefined();
        expect(performance.bestPerforming.performance)
          .toBeGreaterThanOrEqual(performance.worstPerforming.performance);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const invalidDb = new sqlite3.Database('/invalid/path/trades.db');
      
      await expect(portfolioService.calculatePortfolio(userId))
        .rejects
        .toThrow();
    });

    it('should handle market data service failures', async () => {
      marketDataService.getCurrentPrices.mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(portfolioService.calculatePortfolio(userId))
        .rejects
        .toThrow('Service unavailable');
    });
  });
});