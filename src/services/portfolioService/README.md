# Portfolio Service

This service manages portfolio-related operations in the crypto trading application, including portfolio valuation, trade synchronization, and performance tracking.

## Features

- Real-time portfolio valuation
- Trade synchronization
- Performance metrics calculation
- Asset allocation tracking
- Historical performance analysis

## Usage

```javascript
const portfolioService = require('./portfolioService');

// Calculate portfolio value
const portfolio = await portfolioService.calculatePortfolio(userId);

// Sync portfolio after trade
const updatedPortfolio = await portfolioService.syncPortfolio(userId, trade);

// Get performance metrics
const performance = await portfolioService.getPortfolioPerformance(userId, '24h');
```

## API Methods

### calculatePortfolio(userId)
Calculate total portfolio value and holdings.

```javascript
const portfolio = await portfolioService.calculatePortfolio(1);
// Returns:
{
  totalValue: 50000,
  holdings: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: 1.5,
      price: 30000,
      value: 45000,
      allocation: 90
    },
    // ...more holdings
  ],
  lastUpdated: '2023-12-15T12:00:00Z'
}
```

### syncPortfolio(userId, trade)
Update portfolio after trade execution.

```javascript
const trade = {
  symbol: 'BTC',
  amount: 0.1,
  type: 'buy',
  price: 50000
};

const updatedPortfolio = await portfolioService.syncPortfolio(1, trade);
```

### getPortfolioPerformance(userId, timeframe)
Get performance metrics for specified timeframe.

```javascript
const performance = await portfolioService.getPortfolioPerformance(1, '24h');
// Returns:
{
  profitLoss: 5000,
  profitLossPercentage: 10,
  tradeCount: 5,
  volume: 100000,
  bestPerforming: {
    symbol: 'BTC',
    profitLoss: 3000,
    performance: 15
  },
  worstPerforming: {
    symbol: 'ETH',
    profitLoss: -500,
    performance: -5
  }
}
```

## Timeframes

Available timeframes for performance calculation:
- `24h`: Last 24 hours
- `7d`: Last 7 days
- `30d`: Last 30 days
- `1y`: Last year

## Integration

### Market Data
Uses MarketDataService for:
- Real-time price data
- Historical price information

### Database
Interacts with:
- `wallets`: Asset balances
- `trades`: Trading history
- `cryptocurrencies`: Asset information

## Error Handling

Handles various scenarios:
- Database connection issues
- Market data service failures
- Invalid user IDs
- Missing data

## Metrics

Tracks key metrics:
- Portfolio value
- Number of assets
- Trade volume
- Performance indicators

## Testing

Run tests:
```bash
npm test
```

## Dependencies

- sqlite3: Database operations
- MarketDataService: Price data
- pino: Logging