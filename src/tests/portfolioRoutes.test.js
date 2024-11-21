const request = require('supertest');
const app = require('../app');
const portfolioService = require('../services/portfolioService/portfolioService');
const { metrics } = require('../metrics');

jest.mock('../services/portfolioService/portfolioService');
jest.mock('../metrics');

describe('Portfolio Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/portfolio/:userId', () => {
    const userId = 1;
    const mockPortfolio = {
      totalValue: 50000,
      holdings: [
        {
          symbol: 'BTC',
          balance: 1,
          value: 45000,
          allocation: 90
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    beforeEach(() => {
      portfolioService.calculatePortfolio.mockResolvedValue(mockPortfolio);
    });

    it('should return portfolio summary for valid user', async () => {
      const response = await request(app)
        .get(`/api/portfolio/${userId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockPortfolio
      });

      expect(metrics.apiRequests.inc).toHaveBeenCalled();
    });

    it('should handle invalid user ID', async () => {
      const response = await request(app)
        .get('/api/portfolio/invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid user ID'
      });
    });

    it('should handle service errors', async () => {
      portfolioService.calculatePortfolio.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .get(`/api/portfolio/${userId}`)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch portfolio summary'
      });
    });
  });

  describe('POST /api/portfolio/update', () => {
    const validUpdate = {
      userId: 1,
      symbol: 'BTC',
      amount: 0.1,
      type: 'buy'
    };

    const mockUpdatedPortfolio = {
      totalValue: 55000,
      holdings: [
        {
          symbol: 'BTC',
          balance: 1.1,
          value: 49500,
          allocation: 90
        }
      ]
    };

    beforeEach(() => {
      portfolioService.syncPortfolio.mockResolvedValue(mockUpdatedPortfolio);
    });

    it('should update portfolio successfully', async () => {
      const response = await request(app)
        .post('/api/portfolio/update')
        .send(validUpdate)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUpdatedPortfolio
      });
    });

    it('should validate required parameters', async () => {
      const invalidUpdate = { ...validUpdate };
      delete invalidUpdate.amount;

      const response = await request(app)
        .post('/api/portfolio/update')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Missing required parameters'
      });
    });

    it('should validate trade type', async () => {
      const invalidUpdate = {
        ...validUpdate,
        type: 'invalid'
      };

      const response = await request(app)
        .post('/api/portfolio/update')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid trade type'
      });
    });

    it('should handle service errors', async () => {
      portfolioService.syncPortfolio.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .post('/api/portfolio/update')
        .send(validUpdate)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to update portfolio'
      });
    });
  });

  describe('GET /api/portfolio/performance/:userId', () => {
    const userId = 1;
    const mockPerformance = {
      profitLoss: 5000,
      profitLossPercentage: 10,
      tradeCount: 5,
      volume: 100000,
      bestPerforming: {
        symbol: 'BTC',
        profitLoss: 3000,
        performance: 15
      },
      worstPerforming: {
        symbol: 'ETH',
        profitLoss: -500,
        performance: -5
      }
    };

    beforeEach(() => {
      portfolioService.getPortfolioPerformance.mockResolvedValue(mockPerformance);
    });

    it('should return performance metrics for valid timeframe', async () => {
      const response = await request(app)
        .get(`/api/portfolio/performance/${userId}`)
        .query({ timeframe: '24h' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockPerformance
      });
    });

    it('should validate timeframe parameter', async () => {
      const response = await request(app)
        .get(`/api/portfolio/performance/${userId}`)
        .query({ timeframe: 'invalid' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid timeframe'
      });
    });

    it('should use default timeframe if not specified', async () => {
      await request(app)
        .get(`/api/portfolio/performance/${userId}`)
        .expect(200);

      expect(portfolioService.getPortfolioPerformance)
        .toHaveBeenCalledWith(userId, '24h');
    });

    it('should handle service errors', async () => {
      portfolioService.getPortfolioPerformance.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .get(`/api/portfolio/performance/${userId}`)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch portfolio performance'
      });
    });
  });

  describe('Rate Limiting', () => {
    const userId = 1;

    it('should enforce rate limits', async () => {
      // Make 31 requests (1 over limit)
      const requests = Array(31).fill().map(() =>
        request(app)
          .get(`/api/portfolio/${userId}`)
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(res => res.status === 429);

      expect(rateLimited.length).toBe(1);
      expect(metrics.rateLimitHits.inc).toHaveBeenCalled();
    });
  });
});