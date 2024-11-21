# Market Data Service

This service handles all interactions with cryptocurrency market data APIs, specifically the CoinGecko API. It provides real-time and historical price data while implementing caching to optimize API usage.

## Features

- Real-time cryptocurrency price data
- Historical OHLC (Open, High, Low, Close) data
- Response caching to minimize API calls
- Error handling and retry logic
- Symbol to CoinGecko ID mapping

## Usage

```javascript
const marketDataService = require('./marketDataService');

// Get current prices
const prices = await marketDataService.getCurrentPrices(['BTC', 'ETH']);

// Get historical data
const ohlcData = await marketDataService.getHistoricalData('BTC', 7); // 7 days
```

## API Methods

### getCurrentPrices(symbols)
Fetches current prices for specified cryptocurrencies.

```javascript
const prices = await marketDataService.getCurrentPrices(['BTC', 'ETH']);
```

### getHistoricalData(symbol, days)
Fetches historical OHLC data for a specific cryptocurrency.

```javascript
const history = await marketDataService.getHistoricalData('BTC', 1);
```

### clearCache(key?)
Clears the cache for a specific key or all cached data.

```javascript
// Clear specific cache
marketDataService.clearCache('prices_BTC_ETH');

// Clear all cache
marketDataService.clearCache();
```

## Caching

- Default TTL: 60 seconds
- Cache keys:
  - Current prices: `prices_${symbols.join('_')}`
  - Historical data: `ohlc_${symbol}_${days}`

## Error Handling

The service includes comprehensive error handling for:
- API rate limits
- Network errors
- Invalid symbols
- Malformed responses

## Testing

Run tests using:
```bash
npm test
```

## Dependencies

- axios: HTTP client
- node-cache: In-memory caching