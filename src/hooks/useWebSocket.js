import { useEffect, useRef, useCallback, useState } from 'react';
import { WS_CONFIG, getWebSocketUrl } from '../config/websocket';

export const useWebSocket = (onMessage) => {
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(getWebSocketUrl());
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        
        // Start heartbeat
        wsRef.current.pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, WS_CONFIG.HEARTBEAT_INTERVAL);
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') return;
        onMessage?.(data);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        clearInterval(wsRef.current?.pingInterval);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          setTimeout(connect, WS_CONFIG.RECONNECT_INTERVAL);
        } else {
          setError('Maximum reconnection attempts reached');
        }
      };
    } catch (err) {
      setError(err.message);
    }
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        clearInterval(wsRef.current.pingInterval);
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      setError('WebSocket is not connected');
    }
  }, []);

  return {
    sendMessage,
    isConnected,
    error
  };
};
