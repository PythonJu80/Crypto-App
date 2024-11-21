import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { metrics } from '../metrics';
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
});

/**
 * Verify JWT token from Authorization header
 */
export const verifyToken = async (req, res, next) => {
  const startTime = process.hrtime();
  const endpoint = req.path;
  
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      metrics.authFailures.inc({ reason: 'missing_token', endpoint });
      metrics.authAttempts.inc({ status: 'failure', method: 'jwt', endpoint });
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Record metrics
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds + nanoseconds / 1e9;
    metrics.tokenVerificationTime.observe(duration);
    metrics.authAttempts.inc({ status: 'success', method: 'jwt', endpoint });
    metrics.authLatency.observe({ method: 'jwt', endpoint }, duration);

    // Track memory and CPU usage
    const memUsage = process.memoryUsage();
    metrics.authMemoryUsage.set(memUsage.heapUsed);
    metrics.authCpuUsage.set(process.cpuUsage().user / 1000000);

    next();
  } catch (error) {
    // Record failure metrics
    metrics.authFailures.inc({ 
      reason: error.name === 'TokenExpiredError' ? 'expired_token' : 'invalid_token',
      endpoint 
    });
    metrics.authAttempts.inc({ status: 'failure', method: 'jwt', endpoint });

    logger.error({ 
      error,
      token: '***',
      endpoint,
      headers: req.headers
    }, 'Token verification failed');

    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Verify request signature
 */
export const verifySignature = (req, res, next) => {
  const startTime = process.hrtime();
  const endpoint = req.path;
  
  try {
    const timestamp = req.headers['x-timestamp'];
    const signature = req.headers['x-signature'];
    const body = JSON.stringify(req.body);

    // Verify timestamp is within acceptable range (5 minutes)
    const timestampMs = parseInt(timestamp);
    const now = Date.now();
    if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
      metrics.authFailures.inc({ reason: 'expired_timestamp', endpoint });
      metrics.authAttempts.inc({ status: 'failure', method: 'signature', endpoint });
      return res.status(401).json({ error: 'Request expired' });
    }

    // Calculate expected signature
    const message = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.API_SECRET)
      .update(message)
      .digest('hex');

    if (signature !== expectedSignature) {
      metrics.authFailures.inc({ reason: 'invalid_signature', endpoint });
      metrics.authAttempts.inc({ status: 'failure', method: 'signature', endpoint });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Record success metrics
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds + nanoseconds / 1e9;
    metrics.signatureVerificationTime.observe(duration);
    metrics.authAttempts.inc({ status: 'success', method: 'signature', endpoint });
    metrics.authLatency.observe({ method: 'signature', endpoint }, duration);

    next();
  } catch (error) {
    // Record failure metrics
    metrics.authFailures.inc({ reason: 'signature_error', endpoint });
    metrics.authAttempts.inc({ status: 'failure', method: 'signature', endpoint });

    logger.error({ 
      error,
      endpoint,
      headers: req.headers
    }, 'Signature verification failed');

    res.status(401).json({ error: 'Signature verification failed' });
  }
};

/**
 * Check if user has required permission
 */
export const checkPermission = (permission) => {
  return async (req, res, next) => {
    const endpoint = req.path;
    
    try {
      const { permissions = [] } = req.user;
      
      const hasPermission = permissions.includes(permission);
      metrics.permissionChecks.inc({ 
        status: hasPermission ? 'success' : 'failure',
        permission,
        endpoint
      });

      if (!hasPermission) {
        metrics.authFailures.inc({ reason: 'insufficient_permissions', endpoint });
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      metrics.authFailures.inc({ reason: 'permission_error', endpoint });
      logger.error({ error, endpoint }, 'Permission check failed');
      res.status(403).json({ error: 'Permission check failed' });
    }
  };
};