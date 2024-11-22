import axios from 'axios';
import WebSocket from 'ws';

const APP_URL = process.env.APP_URL || 'http://localhost:8080';
const WS_URL = APP_URL.replace('http', 'ws');

describe('Smoke Tests', () => {
  describe('Basic API Health', () => {
    it('should respond to health check', async () => {
      const response = await axios.get(`${APP_URL}/api/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
    });

    it('should serve static assets', async () => {
      const response = await axios.get(`${APP_URL}/static/js/main.js`);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/javascript');
    });

    it('should have CORS headers', async () => {
      const response = await axios.options(`${APP_URL}/api/health`);
      expect(response.headers['access-control-allow-origin']).toBeTruthy();
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection', (done) => {
      const ws = new WebSocket(`${WS_URL}/ws`);
      
      ws.on('open', () => {
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should receive market data updates', (done) => {
      const ws = new WebSocket(`${WS_URL}/ws`);
      
      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'market',
          symbol: 'btcusdt'
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        expect(message).toHaveProperty('type', 'market_update');
        expect(message).toHaveProperty('data.price');
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      try {
        await axios.get(`${APP_URL}/api/portfolio`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should accept requests with valid API key', async () => {
      const response = await axios.get(`${APP_URL}/api/portfolio`, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_API_KEY}`
        }
      });
      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array(100).fill().map(() => 
        axios.get(`${APP_URL}/api/market/btcusdt`)
      );

      try {
        await Promise.all(requests);
        fail('Should have thrown a rate limit error');
      } catch (error) {
        expect(error.response.status).toBe(429);
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      try {
        await axios.get(`${APP_URL}/api/nonexistent`);
        fail('Should have thrown a 404 error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should return 400 for invalid requests', async () => {
      try {
        await axios.post(`${APP_URL}/api/trades`, {
          invalidData: true
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.TEST_API_KEY}`
          }
        });
        fail('Should have thrown a 400 error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});
