# Trading Service

This service manages all trading operations in the crypto trading application, providing functionality for executing trades, calculating profit/loss, and managing trade history.

## Features

- Execute buy/sell trades with real-time pricing
- Support for alert-triggered automated trades
- Profit/loss calculation for trades
- Paginated trade history
- Comprehensive logging and metrics
- Transaction management and error handling

## Usage

### Manual Trade Execution
```javascript
const tradingService = require('./tradingService');

// Execute a manual trade
const trade = await tradingService.executeTrade({
  userId: 1,
  symbol: 'BTC',
  amount: 0.1,
  type: 'buy'
});
```

### Alert-Triggered Trade
```javascript
// Execute trade triggered by alert
const alertTrade = await tradingService.executeTrade({
  userId: 1,
  symbol: 'BTC',
  amount: 0.1,
  type: 'buy',
  alertId: 123
});
```

### Calculate Profit/Loss
```javascript
// Get profit/loss for a trade
const profitLoss = await tradingService.calculateProfitLoss(tradeId);
```

### Trade History
```javascript
// Get paginated trade history
const history = await tradingService.getTradeHistory(userId, {
  limit: 10,
  offset: 0
});
```

## Alert-Triggered Trade Flow

1. Alert Service detects price condition met
2. Trading Service receives trade request with alertId
3. Validates user balance and trade parameters
4. Executes trade with alert reference
5. Updates alert status if trade successful
6. Sends notification of trade execution

## Error Handling

Common error scenarios and solutions:

### Insufficient Balance
```javascript
try {
  await tradingService.executeTrade(tradeParams);
} catch (error) {
  if (error.message === 'Insufficient balance') {
    // Handle insufficient funds
  }
}
```

### Invalid Trade Parameters
```javascript
try {
  await tradingService.executeTrade(tradeParams);
} catch (error) {
  if (error.message === 'Invalid trade parameters') {
    // Handle validation errors
  }
}
```

## Debugging

### Trade Execution Issues
1. Check logs with transaction ID:
```javascript
logger.info({ transactionId }, 'Trade details');
```

2. Verify market data:
```javascript
const prices = await marketDataService.getCurrentPrices(['BTC']);
```

3. Monitor metrics:
```javascript
metrics.tradesExecuted.inc({ status: 'failure', type: 'buy' });
```

### Database Issues
1. Check SQLite connection:
```javascript
const db = new sqlite3.Database(dbPath);
```

2. Verify transaction rollback on error:
```javascript
db.run('ROLLBACK', (err) => {
  logger.error({ err }, 'Transaction rollback failed');
});
```

## Rate Limiting

- 5 trades per minute per user
- Configurable via environment variables:
```env
TRADE_RATE_LIMIT=5
TRADE_RATE_WINDOW=60000
```

## Metrics

Available Prometheus metrics:
- `trades_executed_total`
- `trade_execution_time_seconds`
- `trade_volume_total`
- `profit_loss_calculations_total`

## Testing

Run tests:
```bash
npm test                 # All tests
npm run test:watch      # Watch mode
npm run test:stress     # Stress tests
```

## Dependencies

- sqlite3: Database operations
- MarketDataService: Real-time price data
- AlertService: Alert management
- pino: Structured logging
- prom-client: Metrics collection