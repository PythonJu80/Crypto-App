# Notification Panel Component

A PepeUSB-themed notification system for displaying real-time alerts and updates.

## Features

- Real-time notifications via WebSocket
- Filter by notification type (alerts, trades, errors)
- Search functionality
- Session persistence
- USB-styled animations and effects
- Responsive design

## Usage

```jsx
import NotificationPanel from './components/Notifications/NotificationPanel';

function App() {
  return (
    <div className="p-6">
      <NotificationPanel />
    </div>
  );
}
```

## WebSocket Integration

Connects to the notifications channel for real-time updates:

```javascript
socket.on('notifications', (update) => {
  if (update.type === 'notification') {
    // Add new notification
  }
});
```

## Notification Types

- `alert`: Price alerts and system notifications
- `trade`: Trade execution updates
- `error`: System errors and warnings

## Styling

Uses custom PepeUSB theme:
- Neon green accents (#00FF00)
- Pulsing border animations
- Matrix-style hover effects
- USB-themed loading indicators

## Performance

- Limited to last 100 notifications
- Optimized re-renders using React.memo
- Efficient DOM updates with Framer Motion
- Session storage for persistence