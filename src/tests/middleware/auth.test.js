import { verifyToken, verifySignature, checkPermission } from '../../middleware/auth';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { metrics } from '../../metrics';

jest.mock('jsonwebtoken');
jest.mock('crypto');
jest.mock('../../metrics');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      body: {},
      path: '/api/test'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockUser = { id: 1, permissions: ['trade'] };
      mockReq.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue(mockUser);

      await verifyToken(mockReq, mockRes, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(mockReq.user).toEqual(mockUser);
      expect(nextFunction).toHaveBeenCalled();
      expect(metrics.authAttempts.inc).toHaveBeenCalledWith({
        status: 'success',
        method: 'jwt',
        endpoint: '/api/test'
      });
      expect(metrics.tokenVerificationTime.observe).toHaveBeenCalled();
      expect(metrics.authLatency.observe).toHaveBeenCalled();
    });

    it('should reject missing token', async () => {
      await verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(metrics.authFailures.inc).toHaveBeenCalledWith({
        reason: 'missing_token',
        endpoint: '/api/test'
      });
    });

    it('should reject expired token', async () => {
      mockReq.headers.authorization = 'Bearer expired-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(metrics.authFailures.inc).toHaveBeenCalledWith({
        reason: 'expired_token',
        endpoint: '/api/test'
      });
    });

    it('should track memory and CPU usage', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: 1 });

      await verifyToken(mockReq, mockRes, nextFunction);

      expect(metrics.authMemoryUsage.set).toHaveBeenCalled();
      expect(metrics.authCpuUsage.set).toHaveBeenCalled();
    });
  });

  describe('verifySignature', () => {
    const mockTimestamp = Date.now().toString();
    const mockSignature = 'valid-signature';

    beforeEach(() => {
      mockReq.headers['x-timestamp'] = mockTimestamp;
      mockReq.headers['x-signature'] = mockSignature;
      mockReq.body = { data: 'test' };

      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(mockSignature)
      };
      crypto.createHmac.mockReturnValue(mockHmac);
    });

    it('should verify valid signature', () => {
      verifySignature(mockReq, mockRes, nextFunction);

      expect(crypto.createHmac).toHaveBeenCalledWith(
        'sha256',
        process.env.API_SECRET
      );
      expect(nextFunction).toHaveBeenCalled();
      expect(metrics.authAttempts.inc).toHaveBeenCalledWith({
        status: 'success',
        method: 'signature',
        endpoint: '/api/test'
      });
      expect(metrics.signatureVerificationTime.observe).toHaveBeenCalled();
    });

    it('should reject expired timestamp', () => {
      mockReq.headers['x-timestamp'] = (Date.now() - 6 * 60 * 1000).toString();

      verifySignature(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Request expired' });
      expect(metrics.authFailures.inc).toHaveBeenCalledWith({
        reason: 'expired_timestamp',
        endpoint: '/api/test'
      });
    });

    it('should reject invalid signature', () => {
      mockReq.headers['x-signature'] = 'invalid-signature';

      verifySignature(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(metrics.authFailures.inc).toHaveBeenCalledWith({
        reason: 'invalid_signature',
        endpoint: '/api/test'
      });
    });
  });

  describe('checkPermission', () => {
    it('should allow user with required permission', async () => {
      mockReq.user = {
        permissions: ['trade', 'view_portfolio']
      };

      const middleware = checkPermission('trade');
      await middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(metrics.permissionChecks.inc).toHaveBeenCalledWith({
        status: 'success',
        permission: 'trade',
        endpoint: '/api/test'
      });
    });

    it('should reject user without required permission', async () => {
      mockReq.user = {
        permissions: ['view_portfolio']
      };

      const middleware = checkPermission('trade');
      await middleware(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(metrics.permissionChecks.inc).toHaveBeenCalledWith({
        status: 'failure',
        permission: 'trade',
        endpoint: '/api/test'
      });
      expect(metrics.authFailures.inc).toHaveBeenCalledWith({
        reason: 'insufficient_permissions',
        endpoint: '/api/test'
      });
    });
  });
});