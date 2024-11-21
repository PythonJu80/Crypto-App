import request from 'supertest';
import app from '../../app';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { metrics } from '../../metrics';

jest.mock('../../metrics');

describe('Authentication Middleware Integration', () => {
  let validToken;
  let validSignature;
  let timestamp;

  beforeEach(() => {
    // Create valid JWT token
    validToken = jwt.sign(
      { id: 1, permissions: ['trade', 'view_portfolio', 'manage_alerts'] },
      process.env.JWT_SECRET
    );

    // Create valid signature
    timestamp = Date.now().toString();
    const message = `${timestamp}.${JSON.stringify({ test: true })}`;
    validSignature = crypto
      .createHmac('sha256', process.env.API_SECRET)
      .update(message)
      .digest('hex');
  });

  describe('Trading Routes', () => {
    it('should require authentication for trade execution', async () => {
      const response = await request(app)
        .post('/api/trades/execute')
        .send({ symbol: 'BTC', amount: 0.1, type: 'buy' });

      expect(response.status).toBe(401);
      expect(metrics.authFailures.inc).toHaveBeenCalledWith({
        reason: 'missing_token'
      });
    });

    it('should require valid signature for trade execution', async () => {
      const response = await request(app)
        .post('/api/trades/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ symbol: 'BTC', amount: 0.1, type: 'buy' });

      expect(response.status).toBe(401);
      expect(metrics.authFailures.inc).toHaveBeenCalledWith({
        reason: 'missing_signature'
      });
    });

    it('should execute trade with valid auth', async () => {
      const response = await request(app)
        .post('/api/trades/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-timestamp', timestamp)
        .set('x-signature', validSignature)
        .send({ symbol: 'BTC', amount: 0.1, type: 'buy' });

      expect(response.status).toBe(201);
    });

    it('should enforce trade permissions', async () => {
      const limitedToken = jwt.sign(
        { id: 1, permissions: ['view_portfolio'] },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .post('/api/trades/execute')
        .set('Authorization', `Bearer ${limitedToken}`)
        .set('x-timestamp', timestamp)
        .set('x-signature', validSignature)
        .send({ symbol: 'BTC', amount: 0.1, type: 'buy' });

      expect(response.status).toBe(403);
      expect(metrics.authFailures.inc).toHaveBeenCalledWith({
        reason: 'insufficient_permissions'
      });
    });
  });

  describe('Portfolio Routes', () => {
    it('should require authentication for portfolio access', async () => {
      const response = await request(app)
        .get('/api/portfolio/1');

      expect(response.status).toBe(401);
    });

    it('should prevent accessing other user portfolios', async () => {
      const response = await request(app)
        .get('/api/portfolio/2')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-timestamp', timestamp)
        .set('x-signature', validSignature);

      expect(response.status).toBe(403);
    });

    it('should allow accessing own portfolio', async () => {
      const response = await request(app)
        .get('/api/portfolio/1')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-timestamp', timestamp)
        .set('x-signature', validSignature);

      expect(response.status).toBe(200);
    });
  });

  describe('Alert Routes', () => {
    it('should require authentication for alert creation', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .send({
          symbol: 'BTC',
          targetPrice: 50000,
          condition: 'above'
        });

      expect(response.status).toBe(401);
    });

    it('should require valid signature for alert creation', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          symbol: 'BTC',
          targetPrice: 50000,
          condition: 'above'
        });

      expect(response.status).toBe(401);
    });

    it('should create alert with valid auth', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-timestamp', timestamp)
        .set('x-signature', validSignature)
        .send({
          symbol: 'BTC',
          targetPrice: 50000,
          condition: 'above'
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on trade execution', async () => {
      const requests = Array(6).fill().map(() =>
        request(app)
          .post('/api/trades/execute')
          .set('Authorization', `Bearer ${validToken}`)
          .set('x-timestamp', timestamp)
          .set('x-signature', validSignature)
          .send({ symbol: 'BTC', amount: 0.1, type: 'buy' })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(res => res.status === 429);

      expect(rateLimited.length).toBe(1);
      expect(metrics.rateLimitHits.inc).toHaveBeenCalled();
    });

    it('should enforce rate limits on alert creation', async () => {
      const requests = Array(11).fill().map(() =>
        request(app)
          .post('/api/alerts')
          .set('Authorization', `Bearer ${validToken}`)
          .set('x-timestamp', timestamp)
          .set('x-signature', validSignature)
          .send({
            symbol: 'BTC',
            targetPrice: 50000,
            condition: 'above'
          })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(res => res.status === 429);

      expect(rateLimited.length).toBe(1);
      expect(metrics.rateLimitHits.inc).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle expired tokens', async () => {
      const expiredToken = jwt.sign(
        { id: 1, permissions: ['trade'] },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      const response = await request(app)
        .post('/api/trades/execute')
        .set('Authorization', `Bearer ${expiredToken}`)
        .set('x-timestamp', timestamp)
        .set('x-signature', validSignature)
        .send({ symbol: 'BTC', amount: 0.1, type: 'buy' });

      expect(response.status).toBe(401);
      expect(metrics.authFailures.inc).toHaveBeenCalledWith({
        reason: 'expired_token'
      });
    });

    it('should handle invalid signatures', async () => {
      const response = await request(app)
        .post('/api/trades/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-timestamp', timestamp)
        .set('x-signature', 'invalid-signature')
        .send({ symbol: 'BTC', amount: 0.1, type: 'buy' });

      expect(response.status).toBe(401);
      expect(metrics.authFailures.inc).toHaveBeenCalledWith({
        reason: 'invalid_signature'
      });
    });

    it('should handle expired timestamps', async () => {
      const oldTimestamp = (Date.now() - 6 * 60 * 1000).toString(); // 6 minutes old

      const response = await request(app)
        .post('/api/trades/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-timestamp', oldTimestamp)
        .set('x-signature', validSignature)
        .send({ symbol: 'BTC', amount: 0.1, type: 'buy' });

      expect(response.status).toBe(401);
      expect(metrics.authFailures.inc).toHaveBeenCalledWith({
        reason: 'expired_timestamp'
      });
    });
  });
});