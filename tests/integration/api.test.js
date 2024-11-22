import request from 'supertest';
import { app } from '../../src/server.js';
import configManager from '../../config/config-manager.js';

describe('API Integration Tests', () => {
  describe('Health Check Endpoint', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Trading API Endpoints', () => {
    it('should fetch market data successfully', async () => {
      const response = await request(app)
        .get('/api/market/btcusdt')
        .set('Authorization', `Bearer ${process.env.TEST_API_KEY}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('volume');
    });

    it('should handle invalid trading pair', async () => {
      const response = await request(app)
        .get('/api/market/invalid')
        .set('Authorization', `Bearer ${process.env.TEST_API_KEY}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Portfolio API Endpoints', () => {
    it('should fetch portfolio data successfully', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .set('Authorization', `Bearer ${process.env.TEST_API_KEY}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('assets');
      expect(Array.isArray(response.body.assets)).toBe(true);
    });
  });

  describe('API Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array(60).fill().map(() => 
        request(app)
          .get('/api/market/btcusdt')
          .set('Authorization', `Bearer ${process.env.TEST_API_KEY}`)
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });
});
