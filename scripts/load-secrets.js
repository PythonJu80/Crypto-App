import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine which .env file to use
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production'
  : '.env.production.example';

// Load environment variables
dotenv.config({
  path: path.resolve(__dirname, '..', envFile)
});

/**
 * Fetches secrets from the environment or secret management service
 */
async function fetchSecrets() {
  const requiredSecrets = [
    'COINGECKO_API_KEY'
  ];

  // Only require Binance keys if testnet is not enabled
  if (process.env.BINANCE_USE_TESTNET !== 'true') {
    requiredSecrets.push('BINANCE_API_KEY', 'BINANCE_API_SECRET');
  }

  const secrets = {
    API_SECRET: process.env.API_SECRET || 'test_api_secret_for_development',
    JWT_SECRET: process.env.JWT_SECRET || 'test_jwt_secret_for_development',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'test_encryption_key_for_development',
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY || 'test_coingecko_api_key',
    BINANCE_API_KEY: process.env.BINANCE_API_KEY || 'test_binance_api_key',
    BINANCE_API_SECRET: process.env.BINANCE_API_SECRET || 'test_binance_secret'
  };

  // In production, validate that all secrets are properly set
  if (process.env.NODE_ENV === 'production') {
    const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);

    if (missingSecrets.length > 0) {
      throw new Error(
        `Missing required secrets in production: ${missingSecrets.join(', ')}. ` +
        'Please ensure all secrets are properly configured in your environment or secret management service.'
      );
    }
  }

  return secrets;
}

/**
 * Validates environment configuration
 */
function validateConfig() {
  const requiredConfigs = [
    'NODE_ENV',
    'PORT',
    'CORS_ORIGIN',
    'LOG_LEVEL'
  ];

  const missingConfigs = requiredConfigs.filter(config => !process.env[config]);

  if (missingConfigs.length > 0) {
    throw new Error(
      `Missing required configuration: ${missingConfigs.join(', ')}. ` +
      'Please ensure all required configuration is properly set in your environment.'
    );
  }

  // Additional validation for production environment
  if (process.env.NODE_ENV === 'production') {
    const prodConfigs = [];
    
    // Only require SSL configs if SSL is enabled
    if (process.env.ENABLE_SSL === 'true') {
      prodConfigs.push('SSL_KEY_PATH', 'SSL_CERT_PATH');
    }

    // Only require Sentry config if Sentry is enabled
    if (process.env.ENABLE_SENTRY === 'true') {
      prodConfigs.push('SENTRY_DSN');
    }

    if (prodConfigs.length > 0) {
      const missingProdConfigs = prodConfigs.filter(config => !process.env[config]);

      if (missingProdConfigs.length > 0) {
        throw new Error(
          `Missing required production configuration: ${missingProdConfigs.join(', ')}. ` +
          'Please ensure all required configuration is properly set in your environment.'
        );
      }

      // Only verify SSL files if SSL is enabled
      if (process.env.ENABLE_SSL === 'true') {
        const sslFiles = [process.env.SSL_KEY_PATH, process.env.SSL_CERT_PATH];
        const missingSslFiles = sslFiles.filter(file => !fs.existsSync(file));

        if (missingSslFiles.length > 0) {
          throw new Error(
            `Missing SSL certificate files: ${missingSslFiles.join(', ')}. ` +
            'Please ensure all SSL certificate files exist at the specified paths.'
          );
        }
      }
    }
  }
}

/**
 * Loads and validates configuration
 */
async function loadConfig() {
  try {
    // Load environment configuration
    const env = process.env.NODE_ENV || 'development';
    const envFile = env === 'production' ? '.env.production' : '.env.development';
    
    const result = dotenv.config({
      path: path.resolve(__dirname, '..', envFile)
    });

    if (result.error) {
      throw new Error(`Failed to load ${envFile}: ${result.error.message}`);
    }

    // Define required configuration
    const requiredConfig = [
      'NODE_ENV',
      'PORT',
      'LOG_LEVEL',
      'COINGECKO_API_KEY'
    ];

    // Only require Binance API keys if testnet is not enabled
    if (process.env.BINANCE_USE_TESTNET !== 'true') {
      requiredConfig.push('BINANCE_API_KEY', 'BINANCE_API_SECRET');
    }

    // Only require SSL paths if SSL is enabled
    if (process.env.ENABLE_SSL === 'true') {
      requiredConfig.push('SSL_KEY_PATH', 'SSL_CERT_PATH');
    }

    // Only require Sentry DSN if Sentry is enabled
    if (process.env.ENABLE_SENTRY === 'true') {
      requiredConfig.push('SENTRY_DSN');
    }

    // Validate required configuration
    const missingConfig = requiredConfig.filter(key => !process.env[key]);
    
    if (missingConfig.length > 0) {
      throw new Error(`Missing required configuration: ${missingConfig.join(', ')}. Please ensure all required configuration is properly set in your environment.`);
    }

    // Load secrets
    const secrets = await fetchSecrets();

    // Validate configuration
    validateConfig();

    // Build configuration object
    const config = {
      // Environment
      isProduction: env === 'production',
      port: parseInt(process.env.PORT || '3001', 10),
      
      // API Configuration
      coingeckoApiKey: process.env.COINGECKO_API_KEY,
      binanceTestnet: process.env.BINANCE_USE_TESTNET === 'true',
      binanceRestUrl: process.env.BINANCE_USE_TESTNET === 'true' 
        ? process.env.BINANCE_REST_TESTNET_URL 
        : 'https://api.binance.com',
      binanceWsUrl: process.env.BINANCE_USE_TESTNET === 'true'
        ? process.env.BINANCE_WS_TESTNET_URL
        : 'wss://stream.binance.com:9443',
      
      // Security
      apiSecret: process.env.API_SECRET || 'test_api_secret_for_development',
      jwtSecret: process.env.JWT_SECRET || 'test_jwt_secret_for_development',
      encryptionKey: process.env.ENCRYPTION_KEY || 'test_encryption_key_for_development',
      
      // Database
      dbPath: process.env.DB_PATH || path.resolve(__dirname, '..', 'data', 'trades.db'),
      
      // Rate Limiting
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      
      // WebSocket
      wsHeartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10),
      wsReconnectInterval: parseInt(process.env.WS_RECONNECT_INTERVAL || '5000', 10),
      
      // Cache
      enableApiCaching: process.env.ENABLE_API_CACHING === 'true',
      cacheTTL: parseInt(process.env.CACHE_TTL || '300', 10),
      maxCacheSize: parseInt(process.env.MAX_CACHE_SIZE || '100', 10),

      // Logging
      logLevel: process.env.LOG_LEVEL || 'info',
      logFormat: process.env.LOG_FORMAT || 'json',
      logFileEnabled: process.env.LOG_FILE_ENABLED === 'true',
      logFilePath: process.env.LOG_FILE_PATH || 'logs/app.log',

      // Monitoring
      metricsEnabled: process.env.METRICS_ENABLED === 'true',
      metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),

      // Market Data
      marketDataBatchSize: parseInt(process.env.MARKET_DATA_BATCH_SIZE || '50', 10),
      marketDataUpdateInterval: parseInt(process.env.MARKET_DATA_UPDATE_INTERVAL || '5000', 10),
      marketDataRetryAttempts: parseInt(process.env.MARKET_DATA_RETRY_ATTEMPTS || '3', 10),
      marketDataRetryDelay: parseInt(process.env.MARKET_DATA_RETRY_DELAY || '1000', 10),

      corsOrigin: process.env.CORS_ORIGIN,
      enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
      enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
      sslEnabled: process.env.ENABLE_SSL === 'true',
      sslKeyPath: process.env.SSL_KEY_PATH,
      sslCertPath: process.env.SSL_CERT_PATH,
      sentryDsn: process.env.SENTRY_DSN,
      binanceSimulationMode: process.env.BINANCE_SIMULATION_MODE === 'true',
      
      // Feature Flags
      enableSsl: process.env.ENABLE_SSL === 'true',
      enableSentry: process.env.ENABLE_SENTRY === 'true',

      // Optional Configuration
      ...(process.env.ENABLE_SSL === 'true' && {
        sslKeyPath: process.env.SSL_KEY_PATH,
        sslCertPath: process.env.SSL_CERT_PATH
      }),
      
      // Sentry Configuration (only if enabled)
      ...(process.env.ENABLE_SENTRY === 'true' && {
        sentryDsn: process.env.SENTRY_DSN
      })
    };

    console.log(`Configuration loaded successfully`);
    if (!config.isProduction) {
      console.log('Running in development mode with example configuration');
    } else {
      console.log(`Running in ${process.env.NODE_ENV} mode`);
      if (config.binanceSimulationMode) {
        console.log('Binance API running in simulation mode');
      }
      if (config.binanceTestnet) {
        console.log('Using Binance Testnet');
      }
    }

    return config;
  } catch (error) {
    console.error('Failed to load configuration:', error.message);
    throw error;
  }
}

// Run configuration loading if this is the main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  loadConfig()
    .then((config) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to load configuration:', error.message);
      process.exit(1);
    });
}

export { loadConfig };
