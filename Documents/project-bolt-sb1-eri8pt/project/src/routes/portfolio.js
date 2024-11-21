const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const portfolioService = require('../services/portfolioService/portfolioService');
const { metrics } = require('../metrics');
const { verifyToken, verifySignature, checkPermission } = require('../middleware/auth');
const pino = require('pino');

const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
});

// Rate limiting middleware
const portfolioLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  handler: (req, res) => {
    const userId = req.user?.id || 'anonymous';
    metrics.rateLimitHits.inc({ userId, endpoint: 'portfolio' });
    logger.warn({ userId }, 'Portfolio rate limit exceeded');
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.'
    });
  }
});

// Apply authentication and signature verification to all routes
router.use(verifyToken);
router.use(verifySignature);

// Middleware to track API metrics
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
 * Get portfolio summary
 * GET /api/portfolio/:userId
 */
router.get('/:userId', [portfolioLimiter, checkPermission('view_portfolio')], async (req, res) => {
  const userId = parseInt(req.params.userId);

  // Verify user is accessing their own portfolio or has admin permission
  if (userId !== req.user.id && !req.user.permissions.includes('admin')) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized to view this portfolio'
    });
  }

  logger.info({ userId }, 'Fetching portfolio summary');

  try {
    const portfolio = await portfolioService.calculatePortfolio(userId);
    
    res.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    logger.error({ error, userId }, 'Failed to fetch portfolio');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio summary'
    });
  }
});

/**
 * Get portfolio performance
 * GET /api/portfolio/performance/:userId
 */
router.get('/performance/:userId', [verifyToken, checkPermission('view_portfolio')], async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { timeframe = '24h' } = req.query;

  // Verify user is accessing their own portfolio or has admin permission
  if (userId !== req.user.id && !req.user.permissions.includes('admin')) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized to view this portfolio'
    });
  }

  // Validate timeframe
  const validTimeframes = ['24h', '7d', '30d', '1y'];
  if (!validTimeframes.includes(timeframe)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid timeframe'
    });
  }

  logger.info({ userId, timeframe }, 'Fetching portfolio performance');

  try {
    const performance = await portfolioService.getPortfolioPerformance(userId, timeframe);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error({ error, userId }, 'Failed to fetch portfolio performance');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio performance'
    });
  }
});

/**
 * Update portfolio after trade
 * POST /api/portfolio/update
 */
router.post('/update', [verifyToken, checkPermission('manage_portfolio')], async (req, res) => {
  const { symbol, amount, type } = req.body;
  const userId = req.user.id;

  logger.info({ userId, symbol, amount, type }, 'Updating portfolio');

  try {
    // Validate input
    if (!symbol || !amount || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    if (!['buy', 'sell'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trade type'
      });
    }

    const updatedPortfolio = await portfolioService.syncPortfolio(userId, {
      symbol,
      amount: parseFloat(amount),
      type
    });

    res.json({
      success: true,
      data: updatedPortfolio
    });
  } catch (error) {
    logger.error({ error, userId }, 'Failed to update portfolio');
    res.status(500).json({
      success: false,
      error: 'Failed to update portfolio'
    });
  }
});

module.exports = router;