import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { createServer } from 'https';
import fs from 'fs';
import path from 'path';
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { config } from './config.js';
import { metrics } from './metrics.js';
import tradingRoutes from './routes/trading.js';
import alertRoutes from './routes/alerts.js';
import portfolioRoutes from './routes/portfolio.js';
import pino from 'pino';

// Initialize logger
const logger = pino({
  name: 'server',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: ['req.headers.authorization', 'req.headers.cookie', 'body.password']
});

const app = express();

// Initialize Sentry (only in production and if enabled)
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SENTRY === 'true') {
  logger.info('Initializing Sentry monitoring');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ],
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    tracesSampleRate: 1.0,
    // Capture errors in async code
    enableAutoSessionTracking: true,
    // Environment-specific configuration
    environment: process.env.NODE_ENV,
    // Additional configuration
    maxBreadcrumbs: 50,
    debug: process.env.NODE_ENV !== 'production',
    attachStacktrace: true,
  });

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
}

// HTTPS configuration
const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  minVersion: 'TLSv1.2',
  ciphers: 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384'
};

const server = createServer(httpsOptions, app);
const wss = new WebSocketServer({ 
  server,
  clientTracking: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
});

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.CORS_ORIGIN],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  expectCt: { enforce: true, maxAge: 30 },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

// Enhanced CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN.split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Compression with security considerations
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Enhanced rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW),
  max: parseInt(process.env.RATE_LIMIT_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
  handler: (req, res) => {
    logger.warn({ ip: req.ip }, 'Rate limit exceeded');
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.'
    });
  }
});
app.use('/api/', limiter);

// Body parsing with size limits
app.use(express.json({ 
  limit: '10kb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10kb'
}));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Remove X-Powered-By header
app.disable('x-powered-by');

// Force HTTPS
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// API routes with logging
app.use('/api/trades', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    logger.info({ 
      path: req.path,
      method: req.method,
      ip: req.ip
    }, 'API request');
  }
  next();
}, tradingRoutes);

app.use('/api/alerts', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    logger.info({ 
      path: req.path,
      method: req.method,
      ip: req.ip
    }, 'API request');
  }
  next();
}, alertRoutes);

app.use('/api/portfolio', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    logger.info({ 
      path: req.path,
      method: req.method,
      ip: req.ip
    }, 'API request');
  }
  next();
}, portfolioRoutes);

// WebSocket handling with security
wss.on('connection', (socket, req) => {
  // Verify origin
  const origin = req.headers.origin;
  if (!corsOptions.origin(origin, () => {})) {
    socket.terminate();
    logger.warn({ origin }, 'Unauthorized WebSocket connection attempt');
    return;
  }

  logger.info({ ip: req.socket.remoteAddress }, 'WebSocket client connected');
  metrics.wsConnections.inc();
  
  const heartbeat = setInterval(() => {
    if (socket.readyState === socket.OPEN) {
      socket.ping();
    }
  }, parseInt(process.env.WS_HEARTBEAT_INTERVAL));

  socket.on('close', () => {
    clearInterval(heartbeat);
    metrics.wsConnections.dec();
    logger.info({ ip: req.socket.remoteAddress }, 'WebSocket client disconnected');
  });

  socket.on('error', (error) => {
    logger.error({ 
      error: error.message,
      ip: req.socket.remoteAddress
    }, 'WebSocket error');
  });
});

// Error Handling
// The error handler must be registered before any other error middleware and after all controllers
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SENTRY === 'true') {
  app.use(Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Only report errors with status code >= 500
      return !error.status || error.status >= 500;
    }
  }));
}

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err);
  
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Determine if this is a known error type
  const isOperational = err.isOperational || false;
  
  // Send error response
  res.status(err.status || 500).json({
    error: {
      message: isOperational ? err.message : 'An unexpected error occurred',
      code: err.code || 'INTERNAL_ERROR',
      status: err.status || 500
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM signal. Starting graceful shutdown...');
  
  // Close WebSocket server
  wss.close(() => {
    logger.info('WebSocket server closed');
  });

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
});

const PORT = process.env.PORT || 3000;  // Use Netlify port or default to 3000 for local testing

// Start the server
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});