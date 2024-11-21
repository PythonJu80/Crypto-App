const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const tradingService = require('../services/tradingService/tradingService');
const { metrics } = require('../metrics');
const { verifyToken, verifySignature, checkPermission } = require('../middleware/auth');
const pino = require('pino');

const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
});

// Rate limiting middleware
const tradeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 trades per minute
  handler: (req, res) => {
    const userId = req.user?.id || 'anonymous';
    metrics.rateLimitHits.inc({ userId, endpoint: 'trades' });
    logger.warn({ userId }, 'Trade rate limit exceeded');
    res.status(429).json({
      success: false,
      error: 'Too many trade requests. Please try again later.'
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
 * Execute a trade
 * POST /api/trades/execute
 */
router.post('/execute', [tradeLimiter, checkPermission('trade')], async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  logger.info({ requestId, body: req.body }, 'Received trade execution request');

  try {
    const { symbol, amount, type } = req.body;
    const userId = req.user.id;

    // Input validation
    if (!symbol || !amount || !type) {
      logger.warn({ requestId, body: req.body }, 'Missing required parameters');
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    if (!['buy', 'sell'].includes(type.toLowerCase())) {
      logger.warn({ requestId, type }, 'Invalid trade type');
      return res.status(400).json({
        success: false,
        error: 'Invalid trade type. Must be "buy" or "sell"'
      });
    }

    if (amount <= 0) {
      logger.warn({ requestId, amount }, 'Invalid trade amount');
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    const trade = await tradingService.executeTrade({
      userId,
      symbol: symbol.toUpperCase(),
      amount: parseFloat(amount),
      type: type.toLowerCase()
    });

    logger.info({ requestId, tradeId: trade.id }, 'Trade executed successfully');
    metrics.tradesExecuted.inc({ status: 'success', type });

    res.status(201).json({
      success: true,
      data: trade
    });
  } catch (error) {
    logger.error({
      requestId,
      error: error.message,
      stack: error.stack
    }, 'Trade execution failed');

    metrics.tradesExecuted.inc({ status: 'failure', type: req.body.type });

    if (error.message === 'Insufficient balance' || 
        error.message === 'Invalid cryptocurrency') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to execute trade'
    });
  }
});

/**
 * Get profit/loss for a trade
 * GET /api/trades/profit-loss/:tradeId
 */
router.get('/profit-loss/:tradeId', [verifyToken, checkPermission('view_trades')], async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  const tradeId = parseInt(req.params.tradeId);

  logger.info({ requestId, tradeId }, 'Received profit/loss calculation request');

  try {
    if (isNaN(tradeId) || tradeId <= 0) {
      logger.warn({ requestId, tradeId }, 'Invalid trade ID');
      return res.status(400).json({
        success: false,
        error: 'Invalid trade ID'
      });
    }

    const profitLoss = await tradingService.calculateProfitLoss(tradeId);
    
    logger.info({ requestId, tradeId, profitLoss }, 'Profit/loss calculated successfully');
    
    res.json({
      success: true,
      data: profitLoss
    });
  } catch (error) {
    logger.error({
      requestId,
      error: error.message,
      stack: error.stack
    }, 'Profit/loss calculation failed');

    if (error.message === 'Trade not found') {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to calculate profit/loss'
    });
  }
});

/**
 * Get user's trade history
 * GET /api/trades/user/:userId
 */
router.get('/user/:userId', [verifyToken, checkPermission('view_trades')], async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  const userId = parseInt(req.params.userId);
  const { limit = 10, offset = 0 } = req.query;

  // Verify user is accessing their own trades or has admin permission
  if (userId !== req.user.id && !req.user.permissions.includes('admin')) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized to view these trades'
    });
  }

  logger.info({ requestId, userId, limit, offset }, 'Received trade history request');

  try {
    if (isNaN(userId) || userId <= 0) {
      logger.warn({ requestId, userId }, 'Invalid user ID');
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const trades = await tradingService.getTradeHistory(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    logger.info({ 
      requestId, 
      userId, 
      tradeCount: trades.length 
    }, 'Trade history retrieved successfully');

    res.json({
      success: true,
      data: trades
    });
  } catch (error) {
    logger.error({
      requestId,
      error: error.message,
      stack: error.stack
    }, 'Failed to fetch trade history');

    res.status(500).json({
      success: false,
      error: 'Failed to fetch trade history'
    });
  }
});

module.exports = router;