import axios from 'axios';
import WebSocket from 'ws';
import { logger } from '../../utils/logger.js';

class MarketDataService {
  constructor() {
    this.isTestnet = process.env.BINANCE_USE_TESTNET === 'true';
    
    // API endpoints
    this.binanceUrl = this.isTestnet 
      ? process.env.BINANCE_REST_TESTNET_URL
      : 'https://api.binance.com';
      
    this.binanceWsUrl = this.isTestnet
      ? process.env.BINANCE_WS_TESTNET_URL
      : 'wss://stream.binance.com:9443';

    this.coingeckoUrl = 'https://api.coingecko.com/api/v3';
    
    // Initialize WebSocket connections
    this.wsConnections = new Map();
    this.wsHeartbeatInterval = parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10);
    this.wsReconnectInterval = parseInt(process.env.WS_RECONNECT_INTERVAL || '5000', 10);
    
    // Initialize cache
    this.priceCache = new Map();
    this.cacheTTL = parseInt(process.env.CACHE_TTL || '300', 10) * 1000;
  }

  async fetchPricesFromProvider(symbols, provider) {
    if (provider === 'binance') {
      const prices = {};
      await Promise.all(symbols.map(async symbol => {
        try {
          const endpoint = this.isTestnet ? '/fapi/v1/ticker/24hr' : '/api/v3/ticker/24hr';
          const response = await axios.get(`${this.binanceUrl}${endpoint}`, {
            params: { symbol: `${symbol}USDT` }
          });
          
          prices[this.symbolToId(symbol)] = {
            usd: parseFloat(response.data.lastPrice),
            usd_24h_change: parseFloat(response.data.priceChangePercent)
          };
          
          logger.debug({ 
            symbol, 
            price: response.data.lastPrice,
            isTestnet: this.isTestnet 
          }, 'Fetched Binance price');
          
        } catch (error) {
          logger.warn({ 
            symbol, 
            error: error.message,
            isTestnet: this.isTestnet 
          }, 'Failed to fetch Binance price');
        }
      }));
      return prices;
    } else {
      const ids = symbols.map(symbol => this.symbolToId(symbol)).join(',');
      const response = await axios.get(`${this.coingeckoUrl}/simple/price`, {
        params: {
          ids,
          vs_currencies: 'usd',
          include_24hr_change: true
        }
      });
      return response.data;
    }
  }

  async subscribeToPrice(symbol, callback) {
    const wsSymbol = `${symbol.toLowerCase()}usdt@ticker`;
    const wsEndpoint = `${this.binanceWsUrl}/ws/${wsSymbol}`;
    
    if (this.wsConnections.has(wsSymbol)) {
      return;
    }

    const ws = new WebSocket(wsEndpoint);
    
    ws.on('open', () => {
      logger.info({ 
        symbol: wsSymbol, 
        isTestnet: this.isTestnet 
      }, 'WebSocket connection established');
      
      // Setup heartbeat
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, this.wsHeartbeatInterval);
      
      ws.on('close', () => {
        clearInterval(heartbeat);
        this.wsConnections.delete(wsSymbol);
        
        // Attempt to reconnect
        setTimeout(() => {
          logger.info({ 
            symbol: wsSymbol,
            isTestnet: this.isTestnet 
          }, 'Attempting to reconnect WebSocket');
          this.subscribeToPrice(symbol, callback);
        }, this.wsReconnectInterval);
      });
    });

    ws.on('message', (data) => {
      try {
        const ticker = JSON.parse(data);
        const price = {
          usd: parseFloat(ticker.c),
          usd_24h_change: parseFloat(ticker.p)
        };
        callback(price);
        
        // Update cache
        this.priceCache.set(symbol, {
          price,
          timestamp: Date.now()
        });
        
      } catch (error) {
        logger.error({ 
          symbol: wsSymbol,
          error: error.message,
          isTestnet: this.isTestnet 
        }, 'Error processing WebSocket message');
      }
    });

    this.wsConnections.set(wsSymbol, ws);
  }

  async getCurrentPrices(symbols = ['BTC', 'ETH']) {
    const cacheKey = `prices_${symbols.join('_')}`;
    const cachedData = this.priceCache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < this.cacheTTL) {
      logger.debug({ 
        symbol: cacheKey, 
        isTestnet: this.isTestnet 
      }, 'Fetched price from cache');
      return cachedData.price;
    }

    for (const provider of ['binance', 'coingecko']) {
      try {
        const prices = await this.fetchPricesFromProvider(symbols, provider);
        this.priceCache.set(cacheKey, {
          price: prices,
          timestamp: Date.now()
        });
        logger.debug({ 
          symbol: cacheKey, 
          isTestnet: this.isTestnet 
        }, 'Fetched price from provider');
        return prices;
      } catch (error) {
        logger.error({ 
          symbol: cacheKey,
          error: error.message,
          isTestnet: this.isTestnet 
        }, 'Failed to fetch price from provider');
      }
    }
  }

  async checkHealth() {
    const health = {
      binance: { status: 'unknown', isTestnet: this.isTestnet },
      coingecko: { status: 'unknown' }
    };

    try {
      const binanceEndpoint = this.isTestnet ? '/fapi/v1/ping' : '/api/v3/ping';
      await axios.get(`${this.binanceUrl}${binanceEndpoint}`);
      health.binance.status = 'healthy';
    } catch (error) {
      health.binance.status = 'unhealthy';
      health.binance.error = error.message;
    }

    try {
      await axios.get(`${this.coingeckoUrl}/ping`, {
        headers: { 'X-CG-API-KEY': process.env.COINGECKO_API_KEY }
      });
      health.coingecko.status = 'healthy';
    } catch (error) {
      health.coingecko.status = 'unhealthy';
      health.coingecko.error = error.message;
    }

    return health;
  }

  symbolToId(symbol) {
    const symbolMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'PEPE': 'pepe',
      'DOGE': 'dogecoin',
      'XRP': 'ripple',
      'SOL': 'solana',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'MATIC': 'matic-network',
      'UNI': 'uniswap',
      'AAVE': 'aave',
      'SNX': 'synthetix-network-token',
      'COMP': 'compound-governance-token',
      'YFI': 'yearn-finance',
      'SUSHI': 'sushi',
      'CAKE': 'pancakeswap-token',
      '1INCH': '1inch',
      'GRT': 'the-graph',
      'BAT': 'basic-attention-token'
    };
    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }
}

export default new MarketDataService();