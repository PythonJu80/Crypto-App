const request = require('supertest');
const app = require('../app');
const portfolioService = require('../services/portfolioService/portfolioService');
const { metrics } = require('../metrics');
const os = require('os');

jest.mock('../services/portfolioService/portfolioService');
jest.mock('../metrics');

describe('Portfolio Routes Stress Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('High Concurrency Tests', () => {
    const mockPortfolio = {
      totalValue: 50000,
      holdings: [
        { symbol: 'BTC', balance: 1, value: 45000, allocation: 90 }
      ],
      lastUpdated: new Date().toISOString()
    };

    beforeEach(() => {
      portfolioService.calculatePortfolio.mockResolvedValue(mockPortfolio);
    });

    it('should handle concurrent portfolio requests', async () => {
      const startTime = Date.now();
      const concurrentRequests = 50;
      
      const requests = Array(concurrentRequests).fill().map((_, index) =>
        request(app)
          .get(`/api/portfolio/${index + 1}`)
      );

      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      const successfulRequests = responses.filter(res => res.status === 200);
      const rateLimited = responses.filter(res => res.status === 429);

      // Verify rate limiting
      expect(rateLimited.length).toBeGreaterThan(0);
      expect(successfulRequests.length).toBeLessThanOrEqual(30); // Rate limit: 30/minute

      // Verify response time
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Verify metrics
      expect(metrics.apiRequests.inc).toHaveBeenCalled();
      expect(metrics.rateLimitHits.inc).toHaveBeenCalled();
    });

    it('should maintain performance under sustained load', async () => {
      const batches = 5;
      const requestsPerBatch = 20;
      const results = [];

      for (let i = 0; i < batches; i++) {
        const batchStart = Date.now();
        
        const requests = Array(requestsPerBatch).fill().map(() =>
          request(app)
            .get('/api/portfolio/1')
        );

        const responses = await Promise.all(requests);
        const batchDuration = Date.now() - batchStart;

        results.push({
          responses,
          duration: batchDuration
        });

        // Brief pause between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verify response times remain consistent
      const avgResponseTimes = results.map(r => r.duration / requestsPerBatch);
      const maxDeviation = Math.max(...avgResponseTimes) - Math.min(...avgResponseTimes);
      
      expect(maxDeviation).toBeLessThan(1000); // Less than 1s deviation
    });
  });

  describe('Portfolio Updates Under Load', () => {
    const mockUpdatedPortfolio = {
      totalValue: 55000,
      holdings: [
        { symbol: 'BTC', balance: 1.1, value: 49500, allocation: 90 }
      ]
    };

    beforeEach(() => {
      portfolioService.syncPortfolio.mockResolvedValue(mockUpdatedPortfolio);
    });

    it('should handle rapid trade updates', async () => {
      const updates = Array(50).fill().map((_, index) => ({
        userId: 1,
        symbol: 'BTC',
        amount: 0.1,
        type: index % 2 === 0 ? 'buy' : 'sell'
      }));

      const startTime = Date.now();
      const responses = await Promise.all(
        updates.map(update =>
          request(app)
            .post('/api/portfolio/update')
            .send(update)
        )
      );

      const duration = Date.now() - startTime;
      const successfulUpdates = responses.filter(res => res.status === 200);
      const rateLimited = responses.filter(res => res.status === 429);

      expect(duration).toBeLessThan(10000); // Complete within 10 seconds
      expect(rateLimited.length).toBeGreaterThan(0); // Rate limiting should kick in
      expect(successfulUpdates.length).toBeLessThanOrEqual(30); // Rate limit: 30/minute
    });

    it('should maintain data consistency during concurrent updates', async () => {
      const userId = 1;
      const symbol = 'BTC';
      const amount = 0.1;

      // Alternating buy/sell trades that should net to zero
      const updates = Array(10).fill().map((_, index) => ({
        userId,
        symbol,
        amount,
        type: index % 2 === 0 ? 'buy' : 'sell'
      }));

      await Promise.all(
        updates.map(update =>
          request(app)
            .post('/api/portfolio/update')
            .send(update)
        )
      );

      // Verify final portfolio state
      const finalResponse = await request(app)
        .get(`/api/portfolio/${userId}`)
        .expect(200);

      const btcHolding = finalResponse.body.data.holdings
        .find(h => h.symbol === symbol);
      
      // Balance should be unchanged due to equal buys/sells
      expect(btcHolding.balance).toBe(mockUpdatedPortfolio.holdings[0].balance);
    });
  });

  describe('Performance Metrics Under Load', () => {
    const mockPerformance = {
      profitLoss: 5000,
      profitLossPercentage: 10,
      tradeCount: 5,
      volume: 100000
    };

    beforeEach(() => {
      portfolioService.getPortfolioPerformance.mockResolvedValue(mockPerformance);
    });

    it('should handle concurrent performance requests', async () => {
      const timeframes = ['24h', '7d', '30d', '1y'];
      const users = Array(10).fill().map((_, i) => i + 1);
      
      const requests = users.flatMap(userId =>
        timeframes.map(timeframe =>
          request(app)
            .get(`/api/portfolio/performance/${userId}`)
            .query({ timeframe })
        )
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      const successful = responses.filter(res => res.status === 200);
      const rateLimited = responses.filter(res => res.status === 429);

      expect(duration).toBeLessThan(10000); // Complete within 10 seconds
      expect(successful.length).toBeGreaterThan(0);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Error Resilience', () => {
    it('should handle service interruptions gracefully', async () => {
      // Simulate service failures
      portfolioService.calculatePortfolio
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockResolvedValueOnce({
          totalValue: 50000,
          holdings: []
        });

      const responses = await Promise.all([
        request(app).get('/api/portfolio/1'),
        request(app).get('/api/portfolio/1')
      ]);

      expect(responses[0].status).toBe(500);
      expect(responses[1].status).toBe(200);
    });

    it('should maintain rate limiting during errors', async () => {
      portfolioService.calculatePortfolio.mockRejectedValue(
        new Error('Service error')
      );

      const requests = Array(40).fill().map(() =>
        request(app)
          .get('/api/portfolio/1')
      );

      const responses = await Promise.all(requests);
      const errors = responses.filter(res => res.status === 500);
      const rateLimited = responses.filter(res => res.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
      expect(errors.length).toBeLessThanOrEqual(30); // Rate limit still applies
    });
  });

  describe('Resource Utilization', () => {
    it('should monitor system resources under load', async () => {
      const initialMemory = process.memoryUsage();
      const initialCpu = os.loadavg()[0];

      // Generate high load
      const requests = Array(100).fill().map(() =>
        request(app)
          .get('/api/portfolio/1')
      );

      await Promise.all(requests);

      const finalMemory = process.memoryUsage();
      const finalCpu = os.loadavg()[0];

      // Verify metrics were collected
      expect(metrics.memoryUsage.set).toHaveBeenCalled();
      expect(metrics.cpuUsage.set).toHaveBeenCalled();

      // Check for memory leaks
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase
    });
  });
});