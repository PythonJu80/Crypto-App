import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

class ConfigManager {
  constructor() {
    this.config = {};
    this.loadEnvironmentVariables();
    this.validateConfig();
  }

  loadEnvironmentVariables() {
    const envFile = process.env.NODE_ENV === 'production' 
      ? '.env.production'
      : '.env.development';

    dotenv.config({
      path: path.resolve(__dirname, '..', envFile)
    });

    this.config = {
      node: {
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT, 10) || 8080
      },
      api: {
        coingecko: {
          key: process.env.COINGECKO_API_KEY,
          baseUrl: 'https://api.coingecko.com/api/v3',
          rateLimit: parseInt(process.env.COINGECKO_RATE_LIMIT, 10) || 50
        },
        binance: {
          useTestnet: process.env.BINANCE_USE_TESTNET === 'true',
          key: process.env.BINANCE_API_KEY,
          secret: process.env.BINANCE_API_SECRET,
          restUrl: process.env.BINANCE_USE_TESTNET === 'true'
            ? process.env.BINANCE_REST_TESTNET_URL
            : 'https://api.binance.com',
          wsUrl: process.env.BINANCE_USE_TESTNET === 'true'
            ? process.env.BINANCE_WS_TESTNET_URL
            : 'wss://stream.binance.com:9443'
        }
      },
      security: {
        cors: {
          origin: process.env.CORS_ORIGIN || '*'
        },
        ssl: {
          enabled: process.env.ENABLE_SSL === 'true',
          keyPath: process.env.SSL_KEY_PATH,
          certPath: process.env.SSL_CERT_PATH
        }
      },
      monitoring: {
        sentry: {
          enabled: process.env.ENABLE_SENTRY === 'true',
          dsn: process.env.SENTRY_DSN
        },
        metrics: {
          enabled: process.env.ENABLE_METRICS === 'true',
          port: parseInt(process.env.METRICS_PORT, 10) || 9090,
          path: process.env.METRICS_PATH || '/metrics'
        }
      },
      caching: {
        enabled: process.env.ENABLE_API_CACHING === 'true',
        ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
        maxSize: parseInt(process.env.MAX_CACHE_SIZE, 10) || 100
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        file: {
          enabled: process.env.LOG_FILE_ENABLED === 'true',
          path: process.env.LOG_FILE_PATH || 'logs/app.log'
        }
      }
    };
  }

  validateConfig() {
    const requiredKeys = {
      'node.env': this.config.node.env,
      'node.port': this.config.node.port,
      'api.coingecko.key': this.config.api.coingecko.key,
      'api.binance.key': this.config.api.binance.key,
      'api.binance.secret': this.config.api.binance.secret
    };

    const missingKeys = Object.entries(requiredKeys)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      const error = new Error(`Missing required configuration: ${missingKeys.join(', ')}`);
      logger.error(error);
      throw error;
    }
  }

  get(key) {
    return key.split('.').reduce((obj, part) => obj && obj[part], this.config);
  }

  getApiConfig() {
    return this.config.api;
  }

  getSecurityConfig() {
    return this.config.security;
  }

  getMonitoringConfig() {
    return this.config.monitoring;
  }

  getCachingConfig() {
    return this.config.caching;
  }

  getLoggingConfig() {
    return this.config.logging;
  }
}

export const configManager = new ConfigManager();
export default configManager;
