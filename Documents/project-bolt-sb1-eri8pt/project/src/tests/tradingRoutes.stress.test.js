const request = require('supertest');
const app = require('../app');
const tradingService = require('../services/tradingService/tradingService');
const alertService = require('../services/alertService/alertService');
const { metrics } = require('../metrics');
const os = require('os');

jest.mock('../services/tradingService/tradingService');
jest.mock('../services/alertService/alertService');
jest.mock('../metrics');

describe('Trading Routes Stress Tests', () => {
  const validTradeData = {
    userId: 1,
    symbol: 'BTC',
    amount: 0.1,
    type: 'buy'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tradingService.executeTrade.mockResolvedValue({
      id: 1,
      ...validTradeData,
      price: 50000,
      total: 5000,
      status: 'completed'
    });
  });

  describe('Rate Limiting and Load Testing', () => {
    it('should handle high-frequency trade requests', async () => {
      const requests = Array(100).fill().map(() =>
        request(app)
          .post('/api/trades/execute')
          .send(validTradeData)
      );

      const responses = await Promise.all(requests);
      const successfulTrades = responses.filter(res => res.status === 201);
      const rateLimited = responses.filter(res => res.status === 429);

      expect(successfulTrades.length).toBeGreaterThan(0);
      expect(rateLimited.length).toBeGreaterThan(0);
      expect(metrics.tradesExecuted.inc).toHaveBeenCalled();
    });

    it('should maintain performance under sustained load', async () => {
      const batches = 5;
      const requestsPerBatch = 20;
      const results = [];

      for (let i = 0; i < batches; i++) {
        const batchRequests = Array(requestsPerBatch).fill().map(() =>
          request(app)
            .post('/api/trades/execute')
            .send(validTradeData)
        );

        const batchStart = Date.now();
        const batchResponses = await Promise.all(batchRequests);
        const batchDuration = Date.now() - batchStart;

        results.push({
          responses: batchResponses,
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

  describe('Alert-Triggered Trades', () => {
    const alertTriggerData = {
      alertId: 1,
      userId: 1,
      symbol: 'BTC',
      targetPrice: 50000,
      condition: 'above'
    };

    beforeEach(() => {
      alertService.getAlert.mockResolvedValue(alertTriggerData);
    });

    it('should execute trades triggered by alerts', async () => {
      const trade = {
        ...validTradeData,
        alertId: alertTriggerData.alertId
      };

      const response = await request(app)
        .post('/api/trades/execute')
        .send(trade)
        .expect(201);

      expect(response.body.data).toHaveProperty('alertId');
      expect(metrics.tradesExecuted.inc).toHaveBeenCalledWith({
        status: 'success',
        type: 'buy',
        source: 'alert'
      });
    });

    it('should handle concurrent alert-triggered trades', async () => {
      const requests = Array(10).fill().map(() =>
        request(app)
          .post('/api/trades/execute')
          .send({
            ...validTradeData,
            alertId: alertTriggerData.alertId
          })
      );

      const responses = await Promise.all(requests);
      const successfulTrades = responses.filter(res => res.status === 201);

      // Only one trade should succeed per alert
      expect(successfulTrades.length).toBe(1);
    });
  });

  describe('Error Recovery and Logging', () => {
    it('should log detailed error information', async () => {
      const errorScenarios = [
        { ...validTradeData, amount: -1 },
        { ...validTradeData, symbol: '' },
        { ...validTradeData, type: 'invalid' }
      ];

      const requests = errorScenarios.map(data =>
        request(app)
          .post('/api/trades/execute')
          .send(data)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(res => {
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
      });

      expect(metrics.tradesExecuted.inc).toHaveBeenCalledWith({
        status: 'failure',
        type: expect.any(String)
      });
    });

    it('should handle database connection issues gracefully', async () => {
      tradingService.executeTrade.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/trades/execute')
        .send(validTradeData)
        .expect(500);

      expect(response.body.error).toBe('Failed to execute trade');
      expect(metrics.errorCounter.inc).toHaveBeenCalled();
    });
  });

  describe('System Resource Usage', () => {
    it('should monitor resource usage during high load', async () => {
      const initialMemory = process.memoryUsage();
      const initialCpu = os.loadavg()[0];

      // Generate high load
      const requests = Array(500).fill().map(() =>
        request(app)
          .post('/api/trades/execute')
          .send(validTradeData)
      );

      await Promise.all(requests);

      const finalMemory = process.memoryUsage();
      const finalCpu = os.loadavg()[0];

      expect(metrics.memoryUsage.set).toHaveBeenCalled();
      expect(metrics.cpuUsage.set).toHaveBeenCalled();

      // Check for memory leaks
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase
    });
  });
});