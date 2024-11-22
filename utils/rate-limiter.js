import pino from 'pino';
import configManager from '../config/config-manager.js';

const logger = pino(configManager.getLoggingConfig());

class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = new Map();
  }

  async checkLimit(key) {
    const now = Date.now();
    const windowStart = now - this.timeWindow;

    // Clean up old requests
    this.requests.forEach((timestamps, reqKey) => {
      const validTimestamps = timestamps.filter(time => time > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(reqKey);
      } else {
        this.requests.set(reqKey, validTimestamps);
      }
    });

    // Get timestamps for this key
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(time => time > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      const oldestRequest = Math.min(...validTimestamps);
      const resetTime = oldestRequest + this.timeWindow;
      const waitTime = resetTime - now;
      
      logger.warn({
        msg: 'Rate limit exceeded',
        key,
        waitTime,
        resetTime: new Date(resetTime).toISOString()
      });

      throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    // Add current request
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  async withRateLimit(key, fn) {
    await this.checkLimit(key);
    try {
      return await fn();
    } catch (error) {
      logger.error({
        msg: 'Error in rate-limited function',
        key,
        error: error.message
      });
      throw error;
    }
  }
}

// Create rate limiters for different APIs
export const coingeckoLimiter = new RateLimiter(
  configManager.get('api.coingecko.rateLimit') || 50,
  60 * 1000 // 1 minute window
);

export const binanceLimiter = new RateLimiter(
  1200, // Binance has a limit of 1200 requests per minute
  60 * 1000
);

export default {
  coingeckoLimiter,
  binanceLimiter
};
