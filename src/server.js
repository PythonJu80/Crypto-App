import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { config } from './config.js';
import { metrics } from './metrics.js';
import tradingRoutes from './routes/trading.js';
import alertRoutes from './routes/alerts.js';
import portfolioRoutes from './routes/portfolio.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW),
  max: parseInt(process.env.RATE_LIMIT_MAX)
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/trades', tradingRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/portfolio', portfolioRoutes);

// WebSocket handling
wss.on('connection', socket => {
  console.log('Client connected');
  
  const heartbeat = setInterval(() => {
    if (socket.readyState === socket.OPEN) {
      socket.ping();
    }
  }, parseInt(process.env.WS_HEARTBEAT_INTERVAL));

  socket.on('close', () => {
    clearInterval(heartbeat);
    console.log('Client disconnected');
  });

  socket.on('error', error => {
    console.error('WebSocket error:', error);
    metrics.wsErrors.inc();
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  metrics.errors.inc({ type: err.name });
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});