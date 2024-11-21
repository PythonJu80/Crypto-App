const axios = require('axios');
const NodeCache = require('node-cache');

// Initialize cache with 1-minute standard TTL
const cache = new NodeCache({ stdTTL: 60 });

class MarketDataService {
  constructor() {
    this.baseUrl = 'https://api.coingecko.com/api/v3';
    this.cache = cache;
  }

  /**
   * Fetch current prices for specified cryptocurrencies
   * @param {string[]} symbols - Array of cryptocurrency symbols
   * @returns {Promise<Object>} Current prices
   */
  async getCurrentPrices(symbols = ['BTC', 'ETH']) {
    const cacheKey = `prices_${symbols.join('_')}`;
    const cachedData = this.cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const ids = symbols.map(symbol => this.symbolToId(symbol)).join(',');
      const response = await axios.get(`${this.baseUrl}/simple/price`, {
        params: {
          ids,
          vs_currencies: 'usd',
          include_24hr_change: true
        }
      });

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch current prices: ${error.message}`);
    }
  }

  /**
   * Fetch historical OHLC data
   * @param {string} symbol - Cryptocurrency symbol
   * @param {number} days - Number of days of historical data
   * @returns {Promise<Array>} OHLC data
   */
  async getHistoricalData(symbol, days = 1) {
    const cacheKey = `ohlc_${symbol}_${days}`;
    const cachedData = this.cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const id = this.symbolToId(symbol);
      const response = await axios.get(`${this.baseUrl}/coins/${id}/ohlc`, {
        params: {
          vs_currency: 'usd',
          days
        }
      });

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch historical data: ${error.message}`);
    }
  }

  /**
   * Convert cryptocurrency symbol to CoinGecko ID
   * @param {string} symbol - Cryptocurrency symbol
   * @returns {string} CoinGecko ID
   */
  symbolToId(symbol) {
    const symbolMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      // Add more mappings as needed
    };
    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  /**
   * Clear cache for specific key or all cache
   * @param {string} [key] - Specific cache key to clear
   */
  clearCache(key = null) {
    if (key) {
      this.cache.del(key);
    } else {
      this.cache.flushAll();
    }
  }
}

module.exports = new MarketDataService();