import reinvestmentService from '../services/reinvestmentService/reinvestmentService';
import tradingService from '../services/tradingService/tradingService';
import marketDataService from '../services/marketDataService/marketDataService';
import { config } from '../config';
import { metrics } from '../metrics';

jest.mock('../services/tradingService/tradingService');
jest.mock('../services/marketDataService/marketDataService');
jest.mock('../metrics');

describe('ReinvestmentService', () => {
  const mockTrade = {
    id: 1,
    userId: 1,
    symbol: 'BTC',
    amount: 0.1,
    price: 50000,
    type: 'sell'
  };

  const mockMarketData = [
    {
      symbol: 'BTC',
      volume24h: 5000000,
      marketCap: 100000000,
      priceChange24h: 5
    },
    {
      symbol: 'ETH',
      volume24h: 3000000,
      marketCap: 50000000,
      priceChange24h: 3
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    marketDataService.getTopTokens.mockResolvedValue(mockMarketData);
    tradingService.executeTrade.mockResolvedValue({
      id: 2,
      status: 'completed'
    });
  });

  describe('processTradeForReinvestment', () => {
    it('should process valid reinvestment', async () => {
      const profitUSD = 1000; // Above threshold

      const result = await reinvestmentService.processTradeForReinvestment(
        mockTrade,
        profitUSD
      );

      expect(result).toBeDefined();
      expect(result.shortTerm).toBeDefined();
      expect(result.longTerm).toBeDefined();
      expect(metrics.reinvestmentsExecuted.inc).toHaveBeenCalledWith({
        status: 'success',
        type: 'split'
      });
    });

    it('should skip reinvestment below threshold', async () => {
      const lowProfit = config.reinvestment.minProfitThreshold - 1;

      const result = await reinvestmentService.processTradeForReinvestment(
        mockTrade,
        lowProfit
      );

      expect(result).toBeNull();
      expect(tradingService.executeTrade).not.toHaveBeenCalled();
    });

    it('should handle timing constraints', async () => {
      // First reinvestment
      await reinvestmentService.processTradeForReinvestment(mockTrade, 1000);

      // Immediate second attempt
      const result = await reinvestmentService.processTradeForReinvestment(
        mockTrade,
        1000
      );

      expect(result).toBeNull();
    });

    it('should respect maximum pending reinvestments', async () => {
      // Fill up pending reinvestments
      for (let i = 0; i < config.reinvestment.maxPendingReinvestments; i++) {
        await reinvestmentService.processTradeForReinvestment(
          { ...mockTrade, id: i },
          1000
        );
      }

      // Try one more
      const result = await reinvestmentService.processTradeForReinvestment(
        mockTrade,
        1000
      );

      expect(result).toBeNull();
    });

    it('should handle market data service failures', async () => {
      marketDataService.getTopTokens.mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(
        reinvestmentService.processTradeForReinvestment(mockTrade, 1000)
      ).rejects.toThrow('Service unavailable');

      expect(metrics.reinvestmentsExecuted.inc).toHaveBeenCalledWith({
        status: 'failure',
        error: 'Service unavailable'
      });
    });
  });

  describe('Token Selection', () => {
    it('should select tokens based on criteria', async () => {
      const token = await reinvestmentService.selectTokenForReinvestment(false);

      expect(token).toBeDefined();
      expect(token.volume24h).toBeGreaterThanOrEqual(
        config.reinvestment.minDailyVolume
      );
      expect(token.marketCap).toBeGreaterThanOrEqual(
        config.reinvestment.minMarketCap
      );
    });

    it('should apply stricter criteria for long-term holds', async () => {
      const token = await reinvestmentService.selectTokenForReinvestment(true);

      expect(token).toBeDefined();
      expect(token.volume24h).toBeGreaterThanOrEqual(
        config.reinvestment.longTermMinVolume
      );
      expect(token.marketCap).toBeGreaterThanOrEqual(
        config.reinvestment.longTermMinMarketCap
      );
    });

    it('should return null when no tokens meet criteria', async () => {
      marketDataService.getTopTokens.mockResolvedValue([
        {
          symbol: 'LOW',
          volume24h: 100,
          marketCap: 100,
          priceChange24h: 1
        }
      ]);

      const token = await reinvestmentService.selectTokenForReinvestment(false);
      expect(token).toBeNull();
    });
  });

  describe('Momentum Scoring', () => {
    it('should calculate momentum scores correctly', () => {
      const token = {
        volume24h: 5000000,
        marketCap: 100000000,
        priceChange24h: 5
      };

      const shortTermScore = reinvestmentService.calculateMomentumScore(
        token,
        false
      );
      const longTermScore = reinvestmentService.calculateMomentumScore(
        token,
        true
      );

      expect(shortTermScore).toBeGreaterThan(0);
      expect(longTermScore).toBeGreaterThan(0);
      expect(shortTermScore).not.toBe(longTermScore);
    });
  });

  describe('Error Handling', () => {
    it('should handle trading service errors', async () => {
      tradingService.executeTrade.mockRejectedValue(
        new Error('Insufficient balance')
      );

      await expect(
        reinvestmentService.processTradeForReinvestment(mockTrade, 1000)
      ).rejects.toThrow('Insufficient balance');

      expect(metrics.reinvestmentsExecuted.inc).toHaveBeenCalledWith({
        status: 'failure',
        error: 'Insufficient balance'
      });
    });

    it('should cleanup old pending reinvestments', () => {
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      reinvestmentService.pendingReinvestments.set('old_trade', {
        timestamp: oldTimestamp
      });

      reinvestmentService.cleanupCompletedReinvestments();

      expect(reinvestmentService.pendingReinvestments.has('old_trade')).toBe(false);
    });
  });
});