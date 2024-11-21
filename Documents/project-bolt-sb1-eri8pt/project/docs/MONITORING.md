# System Monitoring Guide

## Metrics Collection

### System Metrics
```javascript
const systemMetrics = {
  cpu: new promClient.Gauge({
    name: 'system_cpu_usage',
    help: 'CPU usage percentage'
  }),
  memory: new promClient.Gauge({
    name: 'system_memory_usage',
    help: 'Memory usage in bytes'
  }),
  connections: new promClient.Gauge({
    name: 'system_active_connections',
    help: 'Number of active connections'
  })
};
```

### Business Metrics
```javascript
const businessMetrics = {
  tradeExecution: new promClient.Histogram({
    name: 'trade_execution_time',
    help: 'Trade execution time in seconds',
    buckets: [0.1, 0.5, 1, 2, 5]
  }),
  portfolioCalculation: new promClient.Histogram({
    name: 'portfolio_calculation_time',
    help: 'Portfolio calculation time in seconds',
    buckets: [0.1, 0.5, 1, 2, 5]
  })
};
```

### Error Tracking
```javascript
const errorMetrics = {
  tradingErrors: new promClient.Counter({
    name: 'trading_errors_total',
    help: 'Total number of trading errors',
    labelNames: ['type']
  }),
  alertErrors: new promClient.Counter({
    name: 'alert_errors_total',
    help: 'Total number of alert processing errors',
    labelNames: ['type']
  })
};
```

## Logging Configuration

### Structured Logging
```javascript
const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty'
  },
  base: {
    env: process.env.NODE_ENV
  }
});
```

### Log Levels
- ERROR: System errors requiring immediate attention
- WARN: Potential issues or degraded service
- INFO: Normal operation events
- DEBUG: Detailed debugging information

## Alert Configuration

### System Alerts
```javascript
const systemAlerts = {
  highCpuUsage: {
    threshold: 80,
    duration: '5m',
    severity: 'warning'
  },
  highMemoryUsage: {
    threshold: 85,
    duration: '5m',
    severity: 'warning'
  },
  databaseConnections: {
    threshold: 90,
    duration: '1m',
    severity: 'critical'
  }
};
```

### Business Alerts
```javascript
const businessAlerts = {
  tradeExecutionTime: {
    threshold: 2,
    duration: '1m',
    severity: 'warning'
  },
  errorRate: {
    threshold: 5,
    duration: '5m',
    severity: 'critical'
  }
};
```

## Dashboard Configuration

### System Overview
```javascript
const systemDashboard = {
  refresh: '10s',
  panels: [
    {
      title: 'CPU Usage',
      type: 'gauge',
      metric: 'system_cpu_usage'
    },
    {
      title: 'Memory Usage',
      type: 'gauge',
      metric: 'system_memory_usage'
    },
    {
      title: 'Active Connections',
      type: 'graph',
      metric: 'system_active_connections'
    }
  ]
};
```

### Business Metrics
```javascript
const businessDashboard = {
  refresh: '30s',
  panels: [
    {
      title: 'Trade Execution Time',
      type: 'histogram',
      metric: 'trade_execution_time'
    },
    {
      title: 'Portfolio Calculation Time',
      type: 'histogram',
      metric: 'portfolio_calculation_time'
    },
    {
      title: 'Error Rates',
      type: 'graph',
      metrics: ['trading_errors_total', 'alert_errors_total']
    }
  ]
};
```

## Health Checks

### Endpoint Configuration
```javascript
const healthChecks = {
  database: {
    timeout: '5s',
    interval: '30s'
  },
  marketData: {
    timeout: '5s',
    interval: '1m'
  },
  websocket: {
    timeout: '5s',
    interval: '30s'
  }
};
```

### Response Format
```javascript
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  checks: {
    database: {
      status: 'up' | 'down',
      responseTime: number,
      lastChecked: string
    },
    // ... other checks
  },
  timestamp: string
}
```