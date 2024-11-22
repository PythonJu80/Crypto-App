import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import WebSocket from 'ws';
import pino from 'pino';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logger = pino({ level: 'info' });

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production'
  : '.env.production.example';

dotenv.config({
  path: path.resolve(__dirname, '..', envFile)
});

// Configuration
const config = {
  apiEndpoints: [
    '/api/health',
    '/api/trades',
    '/api/alerts',
    '/api/portfolio'
  ],
  requiredFiles: [
    'index.html',
    'service-worker.js',
    'offline.html',
    'static/js/main.js',
    'static/css/main.css',
    'manifest.json'
  ]
};

// Get required environment variables based on configuration
function getRequiredEnvVars() {
  const vars = [
    'PORT',
    'NODE_ENV',
    'CORS_ORIGIN',
    'LOG_LEVEL',
    'COINGECKO_API_KEY'
  ];

  // Add SSL variables if SSL is enabled
  if (process.env.ENABLE_SSL === 'true') {
    vars.push('SSL_KEY_PATH', 'SSL_CERT_PATH');
  }

  // Add Sentry DSN if Sentry is enabled
  if (process.env.ENABLE_SENTRY === 'true') {
    vars.push('SENTRY_DSN');
  }

  // Add Binance API keys if testnet is not enabled
  if (process.env.BINANCE_USE_TESTNET !== 'true') {
    vars.push('BINANCE_API_KEY', 'BINANCE_API_SECRET');
  }

  return vars;
}

// Validation functions
async function validateBuildFiles() {
  logger.info('Validating build files...');
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distPath)) {
    throw new Error('Build directory does not exist');
  }

  const missingFiles = config.requiredFiles.filter(file => {
    const filePath = path.join(distPath, file);
    const exists = fs.existsSync(filePath);
    if (!exists) {
      logger.error(`Missing file: ${file}`);
    }
    return !exists;
  });

  if (missingFiles.length > 0) {
    throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
  }

  logger.info('✓ Build files validation passed');
  return true;
}

async function validateEnvironmentVariables() {
  logger.info('Validating environment variables...');
  const requiredVars = getRequiredEnvVars();
  const missingVars = requiredVars.filter(variable => !process.env[variable]);

  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  logger.info('✓ Environment variables validation passed');
  return true;
}

async function validateAPIEndpoints() {
  logger.info('Validating API endpoints...');

  try {
    // Test Binance endpoint
    if (process.env.BINANCE_USE_TESTNET === 'true') {
      logger.info('Using Binance Testnet - skipping direct API validation');
    } else {
      const binanceEndpoint = 'https://api.binance.com/api/v3/ping';
      await axios.get(binanceEndpoint);
      logger.info('✓ Binance Mainnet API is accessible');
    }

    // Test WebSocket connection
    if (process.env.BINANCE_USE_TESTNET === 'true') {
      logger.info('Using Binance Testnet - skipping WebSocket validation');
    } else {
      const wsEndpoint = 'wss://stream.binance.com:9443';
      await new Promise((resolve, reject) => {
        const ws = new WebSocket(`${wsEndpoint}/ws/btcusdt@ticker`);
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        ws.on('open', () => {
          clearTimeout(timeout);
          ws.close();
          logger.info('✓ Binance Mainnet WebSocket is accessible');
          resolve();
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    }

    // Test CoinGecko API
    if (process.env.COINGECKO_API_KEY) {
      try {
        await axios.get('https://api.coingecko.com/api/v3/ping', {
          headers: { 'X-CG-API-KEY': process.env.COINGECKO_API_KEY }
        });
        logger.info('✓ CoinGecko API is accessible');
      } catch (error) {
        logger.warn('CoinGecko API validation failed, but continuing:', error.message);
      }
    } else {
      logger.warn('CoinGecko API key not provided - skipping validation');
    }

    logger.info('✓ API endpoint validation completed');

  } catch (error) {
    logger.error('✗ API endpoint validation failed:', error.message);
    throw error;
  }
}

async function validateWebSocketConnection() {
  logger.info('Validating WebSocket connection...');
  // WebSocket validation is now handled in validateAPIEndpoints
  return true;
}

async function validateServiceWorker() {
  logger.info('Validating service worker...');
  const swPath = path.join(__dirname, '..', 'dist', 'service-worker.js');
  
  if (!fs.existsSync(swPath)) {
    throw new Error('Service worker file not found');
  }

  const swContent = fs.readFileSync(swPath, 'utf8');
  const requiredFeatures = [
    'self.addEventListener(\'install\'',
    'self.addEventListener(\'activate\'',
    'self.addEventListener(\'fetch\'',
    'caches.open'
  ];

  const missingFeatures = requiredFeatures.filter(feature => !swContent.includes(feature));

  if (missingFeatures.length > 0) {
    throw new Error(`Service worker missing required features: ${missingFeatures.join(', ')}`);
  }

  logger.info('✓ Service worker validation passed');
  return true;
}

async function validateAssetCompression() {
  logger.info('Validating asset compression...');
  const distPath = path.join(__dirname, '..', 'dist');
  
  const jsFiles = fs.readdirSync(path.join(distPath, 'static/js'));
  const cssFiles = fs.readdirSync(path.join(distPath, 'static/css'));
  
  const compressedFiles = [...jsFiles, ...cssFiles].filter(file => 
    file.endsWith('.gz') || file.endsWith('.br')
  );

  if (compressedFiles.length === 0) {
    throw new Error('No compressed assets found');
  }

  logger.info('✓ Asset compression validation passed');
  return true;
}

async function validateCaching() {
  logger.info('Validating caching configuration...');
  
  const swPath = path.join(__dirname, '..', 'dist', 'service-worker.js');
  
  if (!fs.existsSync(swPath)) {
    logger.error(`Service worker not found at: ${swPath}`);
    throw new Error('Service worker file is missing');
  }

  const swContent = fs.readFileSync(swPath, 'utf8');
  logger.info('Service worker content loaded');
  
  const requiredCacheConfigs = [
    'staticCache',
    'dynamicCache',
    'apiCache'
  ];

  const missingConfigs = requiredCacheConfigs.filter(config => {
    const hasConfig = swContent.includes(config);
    if (!hasConfig) {
      logger.error(`Missing cache configuration: ${config}`);
    }
    return !hasConfig;
  });

  if (missingConfigs.length > 0) {
    throw new Error(`Missing cache configurations: ${missingConfigs.join(', ')}`);
  }

  // Validate cache usage
  const cacheUsagePatterns = {
    staticCache: 'caches.open(staticCache)',
    dynamicCache: 'caches.open(dynamicCache)',
    apiCache: 'caches.open(apiCache)'
  };

  const missingUsage = Object.entries(cacheUsagePatterns).filter(([name, pattern]) => {
    const hasUsage = swContent.includes(pattern);
    if (!hasUsage) {
      logger.error(`Cache '${name}' is defined but not used with pattern: ${pattern}`);
    }
    return !hasUsage;
  });

  if (missingUsage.length > 0) {
    throw new Error(`Cache configurations not properly used: ${missingUsage.map(([name]) => name).join(', ')}`);
  }

  logger.info('✓ Caching configuration validation passed');
  return true;
}

// Main validation function
async function validateBuild() {
  try {
    logger.info('Starting build validation...');
    
    await validateEnvironmentVariables();
    await validateBuildFiles();
    await validateServiceWorker();
    await validateAssetCompression();
    await validateCaching();
    await validateAPIEndpoints();
    
    logger.info('✓ Build validation completed successfully');
    return true;
  } catch (error) {
    logger.error('✗ Build validation failed:', error.message);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

// Run validation if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validateBuild()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { validateBuild };
