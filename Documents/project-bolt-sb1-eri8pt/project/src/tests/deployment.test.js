import request from 'supertest';
import app from '../app';
import { metrics } from '../metrics';
import { WebSocket } from 'ws';

describe('Deployment Readiness Tests', () => {
  describe('Security Configuration', () => {
    it('should have security headers enabled', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Verify Helmet headers
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });

    it('should enforce CORS policy', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-site.com');

      expect(response.headers).not.toHaveProperty('access-control-allow-origin', 'https://malicious-site.com');
    });

    it('should enforce rate limits', async () => {
      const requests = Array(150).fill().map(() =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(res => res.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
      expect(metrics.rateLimitHits.inc).toHaveBeenCalled();
    });
  });

  describe('WebSocket Configuration', () => {
    let ws;

    beforeEach(() => {
      ws = new WebSocket('ws://localhost:3001/ws');
    });

    afterEach(() => {
      ws.close();
    });

    it('should maintain WebSocket connection with heartbeat', done => {
      ws.on('open', () => {
        // Should receive ping within heartbeat interval
        ws.on('ping', () => {
          expect(true).toBe(true);
          done();
        });
      });
    });

    it('should handle connection errors gracefully', done => {
      ws.on('error', error => {
        expect(metrics.wsErrors.inc).toHaveBeenCalled();
        done();
      });

      // Force an error by closing the connection
      ws.close();
      ws.send('test');
    });
  });

  describe('Performance Configuration', () => {
    it('should compress responses', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Accept-Encoding', 'gzip, deflate');

      expect(response.headers['content-encoding']).toBe('gzip');
    });

    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      const requests = Array(50).fill().map(() =>
        request(app).get('/api/health')
      );

      await Promise.all(requests);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle internal server errors properly', async () => {
      // Simulate an internal error
      app.get('/api/test-error', () => {
        throw new Error('Test error');
      });

      const response = await request(app)
        .get('/api/test-error')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(metrics.errors.inc).toHaveBeenCalledWith({ type: 'Error' });
    });
  });

  describe('Environment Configuration', () => {
    it('should have all required environment variables', () => {
      const requiredVars = [
        'NODE_ENV',
        'PORT',
        'JWT_SECRET',
        'API_SECRET',
        'DB_PATH',
        'CORS_ORIGIN'
      ];

      requiredVars.forEach(variable => {
        expect(process.env[variable]).toBeDefined();
      });
    });
  });
});