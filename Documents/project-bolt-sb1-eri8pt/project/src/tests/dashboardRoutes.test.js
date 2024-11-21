const request = require('supertest');
const app = require('../app');
const portfolioService = require('../services/portfolioService/portfolioService');
const { metrics } = require('../metrics');

jest.mock('../services/portfolioService/portfolioService');
jest.mock('../metrics');

describe('Dashboard Routes', () => {
  const userId = 1;
  const mockPortfolio = {
    totalValue: 50000,
    holdings: [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: 1,
        price: 45000,
        value: 45000,
        allocation: 90
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        balance: 2,
        price: 2500,
        value: 5000,
        allocation: 10
      }
    ],
    lastUpdated: new Date().toISOString()
  };

  const mockPerformance = {
    profitLoss: 5000,
    profitLossPercentage: 10,
    tradeCount: 5,
    volume: 100000,
    bestPerforming: {
      symbol: 'BTC',
      profitLoss: 4000,
      performance: 15
    },
    worstPerforming: {
      symbol: 'ETH',
      profitLoss: 1000,
      performance: 5
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    portfolioService.calculatePortfolio.mockResolvedValue(mockPortfolio);
    portfolioService.getPortfolioPerformance.mockResolvedValue(mockPerformance);
  });

  describe('GET /api/portfolio/dashboard/:userId', () => {
    it('should return complete dashboard data', async () => {
      const response = await request(app)
        .get(`/api/portfolio/dashboard/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        summary: {
          totalValue: mockPortfolio.totalValue,
          totalAssets: mockPortfolio.holdings.length,
          profitLoss: mockPerformance.profitLoss,
          profitLossPercentage: mockPerformance.profitLossPercentage
        },
        holdings: {
          top: expect.any(Array),
          distribution: expect.any(Array)
        },
        performance: {
          timeframe: '24h',
          profitLoss: mockPerformance.profitLoss,
          profitLossPercentage: mockPerformance.profitLossPercentage,
          tradeCount: mockPerformance.tradeCount,
          volume: mockPerformance.volume
        },
        lastUpdated: expect.any(String)
      });
    });

    it('should handle different timeframes', async () => {
      const timeframes = ['24h', '7d', '30d', '1y'];

      for (const timeframe of timeframes) {
        const response = await request(app)
          .get(`/api/portfolio/dashboard/${userId}`)
          .query({ timeframe })
          .expect(200);

        expect(response.body.data.performance.timeframe).toBe(timeframe);
      }
    });

    it('should validate timeframe parameter', async () => {
      const response = await request(app)
        .get(`/api/portfolio/dashboard/${userId}`)
        .query({ timeframe: 'invalid' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid timeframe'
      });
    });

    it('should handle empty portfolio', async () => {
      portfolioService.calculatePortfolio.mockResolvedValueOnce({
        totalValue: 0,
        holdings: [],
        lastUpdated: new Date().toISOString()
      });

      const response = await request(app)
        .get(`/api/portfolio/dashboard/${userId}`)
        .expect(200);

      expect(response.body.data.summary.totalValue).toBe(0);
      expect(response.body.data.holdings.top).toHaveLength(0);
    });

    it('should handle service errors', async () => {
      portfolioService.calculatePortfolio.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .get(`/api/portfolio/dashboard/${userId}`)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch dashboard data'
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array(31).fill().map(() =>
        request(app)
          .get(`/api/portfolio/dashboard/${userId}`)
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(res => res.status === 429);

      expect(rateLimited.length).toBe(1);
      expect(metrics.rateLimitHits.inc).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      const requests = Array(10).fill().map(() =>
        request(app)
          .get(`/api/portfolio/dashboard/${userId}`)
      );

      await Promise.all(requests);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should use cached data when available', async () => {
      await request(app)
        .get(`/api/portfolio/dashboard/${userId}`)
        .expect(200);

      await request(app)
        .get(`/api/portfolio/dashboard/${userId}`)
        .expect(200);

      // Should only calculate once due to caching
      expect(portfolioService.calculatePortfolio).toHaveBeenCalledTimes(1);
    });
  });
});