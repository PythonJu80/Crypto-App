# Alert Service

This service manages price alerts for cryptocurrencies in the trading application. It provides functionality for creating, monitoring, and triggering alerts based on user-defined price conditions.

## Features

- Create price alerts with custom conditions
- Monitor cryptocurrency prices in real-time
- Trigger alerts when conditions are met
- Manage alert lifecycle (create, update, delete)
- Support for multiple alert types (above/below price targets)

## Usage

```javascript
const alertService = require('./alertService');

// Create a new alert
const alert = await alertService.createAlert({
  userId: 1,
  symbol: 'BTC',
  targetPrice: 50000,
  condition: 'above'
});

// Get active alerts for a user
const alerts = await alertService.getActiveAlerts(userId);

// Update alert status
await alertService.updateAlertStatus(alertId, false);

// Delete an alert
await alertService.deleteAlert(alertId, userId);

// Start monitoring alerts for a user
alertService.startMonitoring(userId);

// Stop monitoring alerts for a user
alertService.stopMonitoring(userId);
```

## API Methods

### createAlert(alertData)
Creates a new price alert.

Parameters:
- `userId`: User ID
- `symbol`: Cryptocurrency symbol
- `targetPrice`: Target price for the alert
- `condition`: 'above' or 'below'

```javascript
const alert = await alertService.createAlert({
  userId: 1,
  symbol: 'BTC',
  targetPrice: 50000,
  condition: 'above'
});
```

### getActiveAlerts(userId)
Retrieves all active alerts for a user.

```javascript
const alerts = await alertService.getActiveAlerts(1);
```

### updateAlertStatus(alertId, isActive)
Updates the active status of an alert.

```javascript
await alertService.updateAlertStatus(123, false);
```

### deleteAlert(alertId, userId)
Deletes an alert.

```javascript
await alertService.deleteAlert(123, 1);
```

### startMonitoring(userId)
Starts monitoring alerts for a user.

```javascript
alertService.startMonitoring(1);
```

### stopMonitoring(userId)
Stops monitoring alerts for a user.

```javascript
alertService.stopMonitoring(1);
```

## Database Integration

The service interacts with the following tables:
- `alerts`: Stores alert configurations and status
- `cryptocurrencies`: References supported cryptocurrencies

## Market Data Integration

Uses MarketDataService for:
- Real-time price monitoring
- Price checks against alert conditions

## Error Handling

Handles various scenarios:
- Invalid cryptocurrency symbols
- Invalid alert conditions
- Database errors
- Market data API errors

## Testing

Run tests using:
```bash
npm test
```

## Dependencies

- sqlite3: Database operations
- MarketDataService: Real-time price data