const request = require('supertest');
const app = require('../app');
const alertService = require('../services/alertService/alertService');
const { metrics } = require('../metrics');
const os = require('os');

jest.mock('../services/alertService/alertService');
jest.mock('../metrics');

describe('Alert Routes Stress Tests', () => {
  const validAlertData = {
    userId: 1,
    symbol: 'BTC',
    targetPrice: 50000,
    condition: 'above'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    alertService.createAlert.mockResolvedValue({
      id: 1,
      ...validAlertData,
      isActive: true,
      isTriggered: false,
      createdAt: new Date().toISOString()
    });
  });

  describe('Dynamic Rate Limiting', () => {
    it('should adjust rate limits based on server load', async () => {
      // Simulate high CPU usage
      const highLoadRequests = Array(20).fill().map(() => {
        metrics.systemLoad.set(0.8); // 80% CPU load
        return request(app)
          .post('/api/alerts')
          .send(validAlertData);
      });

      const highLoadResponses = await Promise.all(highLoadRequests);
      const highLoadAccepted = highLoadResponses.filter(res => res.status === 201);
      
      // Under high load, fewer requests should be accepted
      expect(highLoadAccepted.length).toBeLessThan(10);

      // Simulate normal CPU usage
      const normalLoadRequests = Array(20).fill().map(() => {
        metrics.systemLoad.set(0.2); // 20% CPU load
        return request(app)
          .post('/api/alerts')
          .send(validAlertData);
      });

      const normalLoadResponses = await Promise.all(normalLoadRequests);
      const normalLoadAccepted = normalLoadResponses.filter(res => res.status === 201);
      
      // Under normal load, more requests should be accepted
      expect(normalLoadAccepted.length).toBeGreaterThan(highLoadAccepted.length);
    });

    it('should handle gradual traffic ramp-up', async () => {
      const rampUpSteps = 5;
      const requestsPerStep = 10;
      const results = [];

      for (let step = 0; step < rampUpSteps; step++) {
        const requests = Array(requestsPerStep).fill().map(() =>
          request(app)
            .post('/api/alerts')
            .send(validAlertData)
        );

        const stepResponses = await Promise.all(requests);
        results.push(stepResponses);

        // Wait briefly between steps
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verify gradual degradation under increasing load
      const successRates = results.map(stepResponses => 
        stepResponses.filter(res => res.status === 201).length / requestsPerStep
      );

      // Success rate should decrease as load increases
      for (let i = 1; i < successRates.length; i++) {
        expect(successRates[i]).toBeLessThanOrEqual(successRates[i - 1]);
      }
    });
  });

  describe('Error Handling and Logging', () => {
    it('should log detailed error metadata', async () => {
      const logEntries = [];
      const mockLogger = {
        error: (meta, msg) => logEntries.push({ meta, msg, timestamp: Date.now() })
      };

      // Simulate various error scenarios
      const errorScenarios = [
        { ...validAlertData, targetPrice: -1 }, // Invalid price
        { ...validAlertData, symbol: '' }, // Missing symbol
        { ...validAlertData, userId: 'invalid' } // Invalid user ID
      ];

      const requests = errorScenarios.map(data =>
        request(app)
          .post('/api/alerts')
          .send(data)
      );

      await Promise.all(requests);

      // Verify error log structure
      logEntries.forEach(entry => {
        expect(entry).toMatchObject({
          meta: expect.objectContaining({
            errorType: expect.any(String),
            userId: expect.any(String),
            requestId: expect.any(String),
            timestamp: expect.any(Number)
          }),
          msg: expect.any(String)
        });
      });

      // Verify error categorization
      const errorTypes = logEntries.map(entry => entry.meta.errorType);
      expect(errorTypes).toContain('ValidationError');
      expect(errorTypes).toContain('InvalidInputError');
    });
  });

  describe('Concurrent Service Interaction', () => {
    it('should handle multiple service calls under load', async () => {
      // Mock market data and notification service interactions
      const mockMarketData = jest.fn().mockResolvedValue({ price: 50000 });
      const mockNotification = jest.fn().mockResolvedValue(true);

      // Simulate concurrent requests with service interactions
      const requests = Array(50).fill().map(async () => {
        const [marketData, alertCreation, notification] = await Promise.all([
          mockMarketData(),
          request(app)
            .post('/api/alerts')
            .send(validAlertData),
          mockNotification()
        ]);

        return {
          marketData,
          alertCreation: alertCreation.status,
          notification
        };
      });

      const results = await Promise.all(requests);

      // Verify service interaction success rates
      const successfulInteractions = results.filter(r => 
        r.marketData && 
        r.alertCreation === 201 && 
        r.notification
      );

      expect(successfulInteractions.length).toBeGreaterThan(0);
    });
  });

  describe('System Resource Monitoring', () => {
    it('should track system resources during high load', async () => {
      const initialMemory = process.memoryUsage();
      const initialCpu = os.loadavg()[0];

      // Generate high load
      const requests = Array(1000).fill().map(() =>
        request(app)
          .post('/api/alerts')
          .send(validAlertData)
      );

      await Promise.all(requests);

      const finalMemory = process.memoryUsage();
      const finalCpu = os.loadavg()[0];

      // Verify resource metrics were collected
      expect(metrics.memoryUsage.set).toHaveBeenCalled();
      expect(metrics.cpuUsage.set).toHaveBeenCalled();

      // Check for memory leaks
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase
    });
  });
});