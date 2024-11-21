import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';

export const useLiveTrades = () => {
  const [trades, setTrades] = useState([]);
  const socket = useWebSocket('trades', (update) => {
    if (update.type === 'trade') {
      setTrades(prev => [update.data, ...prev].slice(0, 50));
    }
  });

  useEffect(() => {
    // Initial fetch of recent trades
    fetch('/api/trades/recent')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTrades(data.data);
        }
      })
      .catch(error => console.error('Failed to fetch recent trades:', error));

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return trades;
};