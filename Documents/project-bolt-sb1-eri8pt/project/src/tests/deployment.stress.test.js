import request from 'supertest';
import app from '../app';
import { metrics } from '../metrics';
import os from 'os';

describe('Deployment Stress Tests', () => {
  describe('Load Testing', () => {
    it('should handle high concurrency', async () => {
      const initialMemory = process.memoryUsage();
      const initialCpu = os.loadavg()[0];

      // Generate high load
      const requests = Array(1000).fill().map(() =>
        request(app)
          .get('/api/health')
          .set('Accept-Encoding', 'gzip')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      const successfulRequests = responses.filter(res => res.status === 200);
      const rateLimited = responses.filter(res => res.status === 429);

      // Performance assertions
      expect(duration).toBeLessThan(30000); // Complete within 30 seconds
      expect(successfulRequests.length).toBeGreaterThan(0);
      expect(rateLimited.length).toBeGreaterThan(0);

      // Resource usage assertions
      const finalMemory = process.memoryUsage();
      const finalCpu = os.loadavg()[0];

      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase

      // Verify metrics were collected
      expect(metrics.memoryUsage.set).toHaveBeenCalled();
      expect(metrics.cpuUsage.set).toHaveBeenCalled();
    });

    it('should maintain WebSocket performance under load', async () => {
      const connections = Array(100).fill().map(() => 
        new Promise((resolve, reject) => {
          const ws = new WebSocket('ws://localhost:3001/ws');
          
          ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'subscribe', channel: 'trades' }));
          };

          ws.onmessage = msg => {
            ws.close();
            resolve(msg);
          };

          ws.onerror = reject;

          // Ensure connections are closed
          setTimeout(() => {
            ws.close();
            resolve();
          }, 5000);
        })
      );

      const results = await Promise.allSettled(connections);
      const successful = results.filter(r => r.status === 'fulfilled');

      expect(successful.length).toBeGreaterThan(90); // 90% success rate
    });
  });

  describe('Database Performance', () => {
    it('should handle concurrent database operations', async () => {
      const operations = Array(50).fill().map(() =>
        request(app)
          .post('/api/trades')
          .send({
            symbol: 'BTC',
            amount: 0.1,
            type: 'buy'
          })
      );

      const results = await Promise.allSettled(operations);
      const successful = results.filter(r => r.status === 'fulfilled');

      expect(successful.length).toBeGreaterThan(45); // 90% success rate
    });

    it('should maintain query performance under load', async () => {
      const queries = Array(100).fill().map(() =>
        request(app)
          .get('/api/portfolio/1')
      );

      const startTime = Date.now();
      await Promise.all(queries);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // Complete within 10 seconds
    });
  });

  describe('Memory Management', () => {
    it('should handle memory-intensive operations', async () => {
      const initialMemory = process.memoryUsage();

      // Simulate memory-intensive operations
      const operations = Array(20).fill().map(() =>
        request(app)
          .get('/api/portfolio/performance/1')
          .query({ timeframe: '30d' })
      );

      await Promise.all(operations);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      expect(memoryIncrease).toBeLessThan(50); // Less than 50MB increase
    });
  });

  describe('Error Recovery', () => {
    it('should recover from service interruptions', async () => {
      // Simulate service failures and recovery
      const requests = Array(10).fill().map((_, index) => {
        if (index % 3 === 0) {
          // Simulate a service failure
          return Promise.reject(new Error('Service unavailable'));
        }
        return request(app).get('/api/health');
      });

      const results = await Promise.allSettled(requests);
      const recovered = results.filter(r => r.status === 'fulfilled');

      expect(recovered.length).toBeGreaterThan(6); // At least 70% recovery
    });
  });
});