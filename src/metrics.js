// Authentication metrics
const authMetrics = {
  authAttempts: new promClient.Counter({
    name: 'auth_attempts_total',
    help: 'Total number of authentication attempts',
    labelNames: ['status', 'method', 'endpoint']
  }),

  authLatency: new promClient.Histogram({
    name: 'auth_latency_seconds',
    help: 'Authentication latency in seconds',
    buckets: [0.01, 0.05, 0.1, 0.5, 1],
    labelNames: ['method', 'endpoint']
  }),

  tokenVerificationTime: new promClient.Histogram({
    name: 'token_verification_time_seconds',
    help: 'Time taken to verify JWT tokens',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1]
  }),

  signatureVerificationTime: new promClient.Histogram({
    name: 'signature_verification_time_seconds',
    help: 'Time taken to verify request signatures',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1]
  }),

  authFailures: new promClient.Counter({
    name: 'auth_failures_total',
    help: 'Total number of authentication failures',
    labelNames: ['reason', 'endpoint']
  }),

  rateLimitHits: new promClient.Counter({
    name: 'rate_limit_hits_total',
    help: 'Total number of rate limit hits',
    labelNames: ['endpoint', 'userId']
  }),

  activeTokens: new promClient.Gauge({
    name: 'active_tokens_total',
    help: 'Number of currently active JWT tokens'
  }),

  permissionChecks: new promClient.Counter({
    name: 'permission_checks_total',
    help: 'Total number of permission checks',
    labelNames: ['status', 'permission', 'endpoint']
  }),

  // Memory metrics
  authMemoryUsage: new promClient.Gauge({
    name: 'auth_memory_usage_bytes',
    help: 'Memory usage of authentication processes'
  }),

  // CPU metrics
  authCpuUsage: new promClient.Gauge({
    name: 'auth_cpu_usage_percent',
    help: 'CPU usage of authentication processes'
  })
};

// Register new metrics
Object.values(authMetrics).forEach(metric => register.registerMetric(metric));

module.exports = {
  // ... existing exports
  metrics: {
    // ... existing metrics
    ...authMetrics
  }
};