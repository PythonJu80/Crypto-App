const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const alertService = require('../services/alertService/alertService');
const { metrics } = require('../metrics');
const { verifyToken, verifySignature, checkPermission } = require('../middleware/auth');
const pino = require('pino');

const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
});

// Rate limiting middleware with metrics
const alertLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  handler: (req, res) => {
    const userId = req.user?.id || 'anonymous';
    metrics.rateLimitHits.inc({ userId });
    logger.warn({ userId }, 'Rate limit exceeded');
    res.status(429).json({
      success: false,
      error: 'Too many alert requests. Please try again later.'
    });
  }
});

// Apply authentication and signature verification to all routes
router.use(verifyToken);
router.use(verifySignature);

// Middleware to track API requests
router.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.apiLatency.observe(
      { method: req.method, endpoint: req.path },
      duration / 1000
    );
    metrics.apiRequests.inc({
      method: req.method,
      endpoint: req.path,
      status: res.statusCode
    });
  });
  next();
});

/**
 * Create a new alert
 * POST /api/alerts
 */
router.post('/', [alertLimiter, checkPermission('create_alerts')], async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  logger.info({ requestId, body: req.body }, 'Received alert creation request');

  try {
    const alertData = {
      ...req.body,
      userId: req.user.id
    };
    
    const alert = await alertService.createAlert(alertData);
    
    // Update metrics
    metrics.alertsCreated.inc({ status: 'success' });
    metrics.alertsPerUser.inc({ userId: req.user.id });

    logger.info({ 
      requestId,
      alertId: alert.id,
      userId: req.user.id 
    }, 'Alert created successfully');

    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    // Update failure metrics
    metrics.alertsCreated.inc({ status: 'failure' });

    logger.error({ 
      requestId,
      error: error.message,
      stack: error.stack,
      body: req.body 
    }, 'Alert creation failed');

    if (error.message === 'DUPLICATE_ALERT') {
      return res.status(400).json({
        success: false,
        error: 'Duplicate alert already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create alert'
    });
  }
});

/**
 * Get alerts for a user
 * GET /api/alerts/user/:userId
 */
router.get('/user/:userId', [verifyToken, checkPermission('view_alerts')], async (req, res) => {
  const userId = parseInt(req.params.userId);

  // Verify user is accessing their own alerts or has admin permission
  if (userId !== req.user.id && !req.user.permissions.includes('admin')) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized to view these alerts'
    });
  }

  logger.info({ userId }, 'Fetching user alerts');

  try {
    const alerts = await alertService.getAlerts(userId);
    metrics.alertsPerUser.set({ userId }, alerts.length);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error({ error, userId }, 'Failed to fetch alerts');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
});

/**
 * Update alert status
 * PATCH /api/alerts/:alertId
 */
router.patch('/:alertId', [verifyToken, checkPermission('manage_alerts')], async (req, res) => {
  const alertId = parseInt(req.params.alertId);
  const { isActive } = req.body;

  logger.info({ alertId, isActive }, 'Updating alert status');

  try {
    const alert = await alertService.updateAlertStatus(alertId, isActive);
    
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error({ error, alertId }, 'Failed to update alert');
    
    if (error.message === 'ALERT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update alert'
    });
  }
});

/**
 * Delete an alert
 * DELETE /api/alerts/:alertId
 */
router.delete('/:alertId', [verifyToken, checkPermission('manage_alerts')], async (req, res) => {
  const alertId = parseInt(req.params.alertId);
  const userId = req.user.id;

  logger.info({ alertId, userId }, 'Deleting alert');

  try {
    const success = await alertService.deleteAlert(alertId, userId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true
    });
  } catch (error) {
    logger.error({ error, alertId }, 'Failed to delete alert');
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert'
    });
  }
});

module.exports = router;