const request = require('supertest');
const app = require('../app');
const tradingService = require('../services/tradingService/tradingService');
const { metrics } = require('../metrics');

jest.mock('../services/tradingService/tradingService');
jest.mock('../metrics');

describe('Trading Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    const validTradeData = {
      userId: 1,
      symbol: 'BTC',
      amount: 0.1,
      type: 'buy'
    };

    it('should enforce rate limits on trade execution', async () => {
      tradingService.executeTrade.mockResolvedValue({
        id: 1,
        ...validTradeData
      });

      // Make 6 requests (1 over limit)
      const requests = Array(6).fill().map(() =>
        request(app)
          .post('/api/trades/execute')
          .send(validTradeData)
      );

      const responses = await Promise.all(requests);
      const limitExceeded = responses.filter(res => res.status === 429);

      expect(limitExceeded.length).toBe(1);
      expect(metrics.rateLimitHits.inc).toHaveBeenCalled();
    });
  });

  describe('POST /api/trades/execute', () => {
    const validTradeData = {
      userId: 1,
      symbol: 'BTC',
      amount: 0.1,
      type: 'buy'
    };

    it('should execute valid trade', async () => {
      const expectedTrade = {
        id: 1,
        ...validTradeData,
        price: 50000,
        total: 5000
      };

      tradingService.executeTrade.mockResolvedValue(expectedTrade);

      const response = await request(app)
        .post('/api/trades/execute')
        .send(validTradeData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: expectedTrade
      });

      expect(metrics.tradesExecuted.inc).toHaveBeenCalledWith({
        status: 'success',
        type: 'buy'
      });
    });

    it('should validate required parameters', async () => {
      const invalidData = { ...validTradeData };
      delete invalidData.amount;

      const response = await request(app)
        .post('/api/trades/execute')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Missing required parameters'
      });
    });

    it('should validate trade type', async () => {
      const invalidData = {
        ...validTradeData,
        type: 'invalid'
      };

      const response = await request(app)
        .post('/api/trades/execute')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid trade type. Must be "buy" or "sell"'
      });
    });

    it('should handle insufficient balance', async () => {
      tradingService.executeTrade.mockRejectedValue(
        new Error('Insufficient balance')
      );

      const response = await request(app)
        .post('/api/trades/execute')
        .send(validTradeData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient balance'
      });

      expect(metrics.tradesExecuted.inc).toHaveBeenCalledWith({
        status: 'failure',
        type: 'buy'
      });
    });
  });

  describe('GET /api/trades/profit-loss/:tradeId', () => {
    const tradeId = 1;

    it('should calculate profit/loss for valid trade', async () => {
      const mockProfitLoss = {
        tradeId: 1,
        entryPrice: 50000,
        currentPrice: 55000,
        profitLoss: 500,
        percentageChange: 10
      };

      tradingService.calculateProfitLoss.mockResolvedValue(mockProfitLoss);

      const response = await request(app)
        .get(`/api/trades/profit-loss/${tradeId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockProfitLoss
      });
    });

    it('should handle non-existent trade', async () => {
      tradingService.calculateProfitLoss.mockRejectedValue(
        new Error('Trade not found')
      );

      const response = await request(app)
        .get(`/api/trades/profit-loss/${tradeId}`)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Trade not found'
      });
    });

    it('should validate trade ID', async () => {
      const response = await request(app)
        .get('/api/trades/profit-loss/invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid trade ID'
      });
    });
  });

  describe('GET /api/trades/user/:userId', () => {
    const userId = 1;
    const mockTrades = [
      {
        id: 1,
        symbol: 'BTC',
        type: 'buy',
        amount: 0.1,
        price: 50000,
        total: 5000
      }
    ];

    it('should return trade history for valid user', async () => {
      tradingService.getTradeHistory.mockResolvedValue(mockTrades);

      const response = await request(app)
        .get(`/api/trades/user/${userId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockTrades
      });
    });

    it('should handle pagination parameters', async () => {
      await request(app)
        .get(`/api/trades/user/${userId}`)
        .query({ limit: 5, offset: 10 })
        .expect(200);

      expect(tradingService.getTradeHistory).toHaveBeenCalledWith(
        userId,
        { limit: 5, offset: 10 }
      );
    });

    it('should validate user ID', async () => {
      const response = await request(app)
        .get('/api/trades/user/invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid user ID'
      });
    });
  });
});