import pino from 'pino';
import * as Sentry from '@sentry/node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import configManager from '../config/config-manager.js';

const logger = pino(configManager.getLoggingConfig());
const monitoringConfig = configManager.getMonitoringConfig();

// Initialize Sentry if enabled
if (monitoringConfig.sentry.enabled && monitoringConfig.sentry.dsn) {
  Sentry.init({
    dsn: monitoringConfig.sentry.dsn,
    environment: configManager.get('node.env'),
    tracesSampleRate: 1.0,
  });
  logger.info('Sentry monitoring initialized');
}

// Initialize OpenTelemetry metrics if enabled
let metricsExporter;
let meter;

if (monitoringConfig.metrics.enabled) {
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'crypto-app',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version,
    environment: configManager.get('node.env')
  });

  metricsExporter = new OTLPMetricExporter({
    url: 'http://localhost:4318/v1/metrics'
  });

  const meterProvider = new MeterProvider({
    resource: resource
  });

  meterProvider.addMetricReader(metricsExporter);
  meter = meterProvider.getMeter('crypto-app');

  logger.info('OpenTelemetry metrics initialized');
}

// Metrics
const metrics = {
  apiRequests: meter?.createCounter('api_requests', {
    description: 'Count of API requests'
  }),
  apiErrors: meter?.createCounter('api_errors', {
    description: 'Count of API errors'
  }),
  tradeVolume: meter?.createCounter('trade_volume', {
    description: 'Total volume of trades'
  }),
  activeWebSockets: meter?.createUpDownCounter('active_websockets', {
    description: 'Number of active WebSocket connections'
  }),
  requestLatency: meter?.createHistogram('request_latency', {
    description: 'Latency of API requests',
    unit: 'milliseconds'
  })
};

// Error tracking
export function trackError(error, context = {}) {
  logger.error({
    error: error.message,
    stack: error.stack,
    ...context
  });

  if (monitoringConfig.sentry.enabled) {
    Sentry.withScope(scope => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  }

  metrics.apiErrors?.add(1, { type: error.name });
}

// Request tracking
export function trackRequest(path, method, duration, status) {
  metrics.apiRequests?.add(1, { path, method, status });
  metrics.requestLatency?.record(duration, { path, method });

  logger.info({
    msg: 'API Request',
    path,
    method,
    duration,
    status
  });
}

// Trade tracking
export function trackTrade(volume, pair, side) {
  metrics.tradeVolume?.add(volume, { pair, side });

  logger.info({
    msg: 'Trade Executed',
    volume,
    pair,
    side
  });
}

// WebSocket tracking
export function trackWebSocket(action) {
  if (action === 'connect') {
    metrics.activeWebSockets?.add(1);
  } else if (action === 'disconnect') {
    metrics.activeWebSockets?.add(-1);
  }

  logger.info({
    msg: 'WebSocket Event',
    action
  });
}

// Health check endpoint
export function getHealthStatus() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: configManager.get('node.env'),
    metrics: {
      enabled: monitoringConfig.metrics.enabled
    },
    sentry: {
      enabled: monitoringConfig.sentry.enabled
    }
  };
}

export default {
  trackError,
  trackRequest,
  trackTrade,
  trackWebSocket,
  getHealthStatus
};
