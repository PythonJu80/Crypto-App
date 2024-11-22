const client = require('prom-client');
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const { RewriteFrames } = require('@sentry/integrations');
const register = new client.Registry();

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new ProfilingIntegration(),
    new RewriteFrames({
      root: global.__dirname,
    }),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
  beforeSend(event) {
    // Sanitize sensitive data
    if (event.request && event.request.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    return event;
  },
});

// Authentication metrics
const authMetrics = {
  authAttempts: new client.Counter({
    name: 'auth_attempts_total',
    help: 'Total number of authentication attempts',
    labelNames: ['status', 'method', 'endpoint']
  }),

  authLatency: new client.Histogram({
    name: 'auth_latency_seconds',
    help: 'Authentication latency in seconds',
    buckets: [0.01, 0.05, 0.1, 0.5, 1],
    labelNames: ['method', 'endpoint']
  }),

  tokenVerificationTime: new client.Histogram({
    name: 'token_verification_time_seconds',
    help: 'Time taken to verify JWT tokens',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1]
  }),

  signatureVerificationTime: new client.Histogram({
    name: 'signature_verification_time_seconds',
    help: 'Time taken to verify request signatures',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1]
  }),

  authFailures: new client.Counter({
    name: 'auth_failures_total',
    help: 'Total number of authentication failures',
    labelNames: ['reason', 'endpoint']
  }),

  rateLimitHits: new client.Counter({
    name: 'rate_limit_hits_total',
    help: 'Total number of rate limit hits',
    labelNames: ['endpoint', 'userId']
  }),

  activeTokens: new client.Gauge({
    name: 'active_tokens_total',
    help: 'Number of currently active JWT tokens'
  }),

  permissionChecks: new client.Counter({
    name: 'permission_checks_total',
    help: 'Total number of permission checks',
    labelNames: ['status', 'permission', 'endpoint']
  })
};

// API Performance Metrics
const apiMetrics = {
  requestDuration: new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  }),

  requestSize: new client.Histogram({
    name: 'http_request_size_bytes',
    help: 'Size of HTTP requests in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000]
  }),

  responseSize: new client.Histogram({
    name: 'http_response_size_bytes',
    help: 'Size of HTTP responses in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000]
  }),

  activeRequests: new client.Gauge({
    name: 'http_active_requests',
    help: 'Number of currently active HTTP requests',
    labelNames: ['method', 'route']
  }),

  requestErrors: new client.Counter({
    name: 'http_request_errors_total',
    help: 'Total number of HTTP request errors',
    labelNames: ['method', 'route', 'error_type', 'status_code']
  })
};

// Cache Performance Metrics
const cacheMetrics = {
  hits: new client.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_type']
  }),

  misses: new client.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_type']
  }),

  size: new client.Gauge({
    name: 'cache_size_bytes',
    help: 'Current size of cache in bytes',
    labelNames: ['cache_type']
  }),

  operations: new client.Counter({
    name: 'cache_operations_total',
    help: 'Total number of cache operations',
    labelNames: ['operation', 'cache_type']
  }),

  latency: new client.Histogram({
    name: 'cache_operation_duration_seconds',
    help: 'Duration of cache operations',
    labelNames: ['operation', 'cache_type'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1]
  })
};

// System Metrics
const systemMetrics = {
  memoryUsage: new client.Gauge({
    name: 'process_memory_usage_bytes',
    help: 'Process memory usage in bytes',
    collect() {
      const usage = process.memoryUsage();
      this.set(usage.heapUsed);
    }
  }),

  cpuUsage: new client.Gauge({
    name: 'process_cpu_usage_percentage',
    help: 'Process CPU usage percentage',
    collect() {
      const startUsage = process.cpuUsage();
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = (endUsage.user + endUsage.system) / 1000000; // Convert to seconds
        this.set(totalUsage * 100);
      }, 1000);
    }
  }),

  eventLoopLag: new client.Gauge({
    name: 'node_event_loop_lag_seconds',
    help: 'Node.js event loop lag in seconds',
    collect() {
      const start = process.hrtime();
      setImmediate(() => {
        const delta = process.hrtime(start);
        this.set(delta[0] + delta[1] / 1e9);
      });
    }
  }),

  activeHandles: new client.Gauge({
    name: 'node_active_handles',
    help: 'Number of active handles',
    collect() {
      this.set(process._getActiveHandles().length);
    }
  }),

  activeRequests: new client.Gauge({
    name: 'node_active_requests',
    help: 'Number of active requests',
    collect() {
      this.set(process._getActiveRequests().length);
    }
  })
};

// WebSocket Metrics
const wsMetrics = {
  connections: new client.Gauge({
    name: 'ws_connections_total',
    help: 'Total number of active WebSocket connections'
  }),

  messages: new client.Counter({
    name: 'ws_messages_total',
    help: 'Total number of WebSocket messages',
    labelNames: ['type', 'direction']
  }),

  errors: new client.Counter({
    name: 'ws_errors_total',
    help: 'Total number of WebSocket errors',
    labelNames: ['type']
  }),

  latency: new client.Histogram({
    name: 'ws_message_latency_seconds',
    help: 'WebSocket message latency in seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1]
  })
};

// Register all metrics
register.registerMetric(Object.values(authMetrics));
register.registerMetric(Object.values(apiMetrics));
register.registerMetric(Object.values(cacheMetrics));
register.registerMetric(Object.values(systemMetrics));
register.registerMetric(Object.values(wsMetrics));

// Export metrics and Sentry
module.exports = {
  register,
  metrics: {
    auth: authMetrics,
    api: apiMetrics,
    cache: cacheMetrics,
    system: systemMetrics,
    ws: wsMetrics
  },
  Sentry
};