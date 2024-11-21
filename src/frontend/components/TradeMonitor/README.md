# Live Trade Monitor Component

A real-time trade monitoring panel with PepeUSB theme styling.

## Features

- Real-time trade updates via WebSocket
- Animated trade entries with matrix-style effects
- PepeUSB themed styling with neon effects
- Auto-scrolling trade list
- Responsive design

## Usage

```jsx
import LiveTrades from './components/TradeMonitor/LiveTrades';

function App() {
  return (
    <div className="p-6">
      <LiveTrades />
    </div>
  );
}
```

## WebSocket Integration

Connects to the trades channel for real-time updates:

```javascript
socket.on('trades', (update) => {
  if (update.type === 'trade') {
    // New trade received
  }
});
```

## Styling

Uses custom PepeUSB theme with:
- Neon green text (#00FF00)
- Pulsing border effects
- Matrix-style animations
- USB-themed loading indicators

## Performance

- Limits trade history to 50 entries
- Uses virtualization for smooth scrolling
- Optimized animations for 60fps