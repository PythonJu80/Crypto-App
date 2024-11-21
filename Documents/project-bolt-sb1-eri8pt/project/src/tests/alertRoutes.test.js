const request = require('supertest');
const app = require('../app');
const alertService = require('../services/alertService/alertService');
const { metrics } = require('../metrics');

jest.mock('../services/alertService/alertService');
jest.mock('../metrics', () => ({
  metrics: {
    alertsCreated: { inc: jest.fn() },
    alertsPerUser: { inc: jest.fn(), set: jest.fn() },
    apiRequests: { inc: jest.fn() },
    rateLimitHits: { inc: jest.fn() }
  }
}));

describe('Alert Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    const validAlertData = {
      userId: 1,
      symbol: 'BTC',
      targetPrice: 50000,
      condition: 'above'
    };

    it('should allow requests within rate limit', async () => {
      alertService.createAlert.mockResolvedValue({
        id: 1,
        ...validAlertData
      });

      // Make 10 requests (at the limit)
      const requests = Array(10).fill().map(() =>
        request(app)
          .post('/api/alerts')
          .send(validAlertData)
      );

      const responses = await Promise.all(requests);
      const successfulRequests = responses.filter(res => res.status === 201);
      
      expect(successfulRequests.length).toBe(10);
      expect(metrics.rateLimitHits.inc).not.toHaveBeenCalled();
    });

    it('should block requests exceeding rate limit', async () => {
      alertService.createAlert.mockResolvedValue({
        id: 1,
        ...validAlertData
      });

      // Make 12 requests (2 over limit)
      const requests = Array(12).fill().map(() =>
        request(app)
          .post('/api/alerts')
          .send(validAlertData)
      );

      const responses = await Promise.all(requests);
      const blockedRequests = responses.filter(res => res.status === 429);
      
      expect(blockedRequests.length).toBe(2);
      expect(metrics.rateLimitHits.inc).toHaveBeenCalledTimes(2);
    });

    it('should track rate limits per user', async () => {
      const user1Data = { ...validAlertData, userId: 1 };
      const user2Data = { ...validAlertData, userId: 2 };

      // Make 10 requests for each user
      const user1Requests = Array(10).fill().map(() =>
        request(app)
          .post('/api/alerts')
          .send(user1Data)
      );

      const user2Requests = Array(10).fill().map(() =>
        request(app)
          .post('/api/alerts')
          .send(user2Data)
      );

      const [user1Responses, user2Responses] = await Promise.all([
        Promise.all(user1Requests),
        Promise.all(user2Requests)
      ]);

      const user1Successful = user1Responses.filter(res => res.status === 201);
      const user2Successful = user2Responses.filter(res => res.status === 201);

      expect(user1Successful.length).toBe(10);
      expect(user2Successful.length).toBe(10);
    });
  });

  describe('Metrics', () => {
    it('should track alert creation metrics', async () => {
      const alertData = {
        userId: 1,
        symbol: 'BTC',
        targetPrice: 50000,
        condition: 'above'
      };

      alertService.createAlert.mockResolvedValue({
        id: 1,
        ...alertData
      });

      await request(app)
        .post('/api/alerts')
        .send(alertData)
        .expect(201);

      expect(metrics.alertsCreated.inc).toHaveBeenCalledWith({ status: 'success' });
      expect(metrics.alertsPerUser.inc).toHaveBeenCalledWith({ userId: 1 });
      expect(metrics.apiRequests.inc).toHaveBeenCalled();
    });

    it('should track failed alert creation metrics', async () => {
      const alertData = {
        userId: 1,
        symbol: 'BTC',
        targetPrice: 50000,
        condition: 'above'
      };

      alertService.createAlert.mockRejectedValue(new Error('Database error'));

      await request(app)
        .post('/api/alerts')
        .send(alertData)
        .expect(500);

      expect(metrics.alertsCreated.inc).toHaveBeenCalledWith({ status: 'failure' });
      expect(metrics.apiRequests.inc).toHaveBeenCalled();
    });

    it('should expose metrics endpoint', async () => {
      const response = await request(app)
        .get('/api/alerts/metrics')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/^text\/plain/);
      expect(response.text).toContain('alerts_created_total');
    });
  });
});