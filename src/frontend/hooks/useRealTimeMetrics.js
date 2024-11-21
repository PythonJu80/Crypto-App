import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

export const useRealTimeMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalTrades: 0,
    portfolioValue: 0,
    activeAlerts: 0,
    dailyVolume: 0,
    successRate: 0
  });

  const socket = useWebSocket('metrics', (update) => {
    if (update.type === 'metrics') {
      setMetrics(prev => ({
        ...prev,
        ...update.data
      }));
    }
  });

  useEffect(() => {
    // Initial fetch of metrics
    fetch('/api/metrics/summary')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetrics(data.data);
        }
      })
      .catch(error => console.error('Failed to fetch metrics:', error));

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return metrics;
};