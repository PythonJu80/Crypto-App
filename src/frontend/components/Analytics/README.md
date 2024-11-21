# Real-Time Analytics Component

A PepeUSB-themed analytics dashboard for monitoring trading metrics in real-time.

## Features

- Live metric updates via WebSocket
- Animated progress bars and counters
- USB-themed visual effects
- Responsive grid layout
- Performance optimized for frequent updates

## Usage

```jsx
import RealTimeAnalytics from './components/Analytics/RealTimeAnalytics';

function App() {
  return (
    <div className="p-6">
      <RealTimeAnalytics />
    </div>
  );
}
```

## WebSocket Integration

Connects to the metrics channel for real-time updates:

```javascript
socket.on('metrics', (update) => {
  if (update.type === 'metrics') {
    // Update metrics state
  }
});
```

## Styling

Uses custom PepeUSB theme:
- Neon green accents (#00FF00)
- Pulsing border animations
- USB-style progress indicators
- Matrix-inspired number transitions

## Performance

- Optimized for 60fps animations
- Debounced WebSocket updates
- Efficient DOM updates using React.memo
- Smooth progress bar transitions