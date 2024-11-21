# Portfolio Dashboard Component

A Binance-themed dashboard for displaying real-time cryptocurrency portfolio data.

## Features

- Real-time portfolio value and performance tracking
- Interactive holdings distribution chart
- Performance metrics with Binance-style visualizations
- WebSocket integration for live updates
- Responsive design with smooth animations
- Keyboard accessible and WCAG compliant

## Usage

```jsx
import PortfolioDashboard from './components/PortfolioDashboard';

function App() {
  return (
    <PortfolioDashboard userId={1} />
  );
}
```

## API Integration

The dashboard connects to the following endpoints:

```javascript
// Fetch dashboard data
GET /api/portfolio/dashboard/:userId

// WebSocket updates
connect to: /api/ws
channel: `portfolio-${userId}`
```

## WebSocket Events

```javascript
// Portfolio update
{
  type: 'update',
  data: {
    summary: { ... },
    holdings: { ... },
    performance: { ... }
  }
}

// Trade execution
{
  type: 'trade_executed',
  data: {
    // Updated portfolio data
  }
}
```

## Styling

Uses Tailwind CSS with custom Binance theme:

```javascript
// tailwind.config.js
{
  theme: {
    extend: {
      colors: {
        binance: {
          yellow: '#F3BA2F',
          black: '#121212',
          // ... other colors
        }
      }
    }
  }
}
```

## Performance

- Initial load: < 1000ms
- Update rendering: < 100ms
- Memory usage: < 50MB

## Accessibility

- WCAG 2.1 AA compliant
- Full keyboard navigation
- Screen reader optimized
- Focus management during updates

## Testing

```bash
# Run all dashboard tests
npm test src/tests/frontend/portfolioDashboard.test.js

# Run with coverage
npm test -- --coverage
```

## Integration Steps

1. Add required dependencies:
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.13.4",
    "recharts": "^2.10.3",
    "socket.io-client": "^4.7.2"
  }
}
```

2. Configure WebSocket connection:
```javascript
import { io } from 'socket.io-client';

const socket = io({
  path: '/api/ws',
  query: { userId: '1' }
});
```

3. Set up API client:
```javascript
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false
    }
  }
});
```

4. Add to your app:
```jsx
import { QueryClientProvider } from '@tanstack/react-query';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PortfolioDashboard userId={1} />
    </QueryClientProvider>
  );
}
```