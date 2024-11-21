# Trade History Panel

A PepeUSB-themed panel for displaying and filtering trade history with infinite scrolling.

## Features

- Infinite scrolling for large trade datasets
- Filter trades by type (buy/sell) and time period
- Real-time profit/loss calculations
- USB-styled animations and hover effects
- Responsive design with custom scrollbars

## Usage

```jsx
import TradeHistoryPanel from './components/TradeHistory/TradeHistoryPanel';

function App() {
  return (
    <div className="p-6">
      <TradeHistoryPanel userId={1} />
    </div>
  );
}
```

## Styling

Uses custom PepeUSB theme:
- Neon green accents (#00FF00)
- Pulsing border animations
- Matrix-style hover effects
- USB-themed loading indicators

## Performance

- Virtualized scrolling for large datasets
- Optimized re-renders using React.memo
- Debounced filter updates
- Efficient DOM updates with Framer Motion