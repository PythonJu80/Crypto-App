import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

export const useWebSocket = (channel, onUpdate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket server
    socketRef.current = io({
      path: '/api/ws',
      query: { channel }
    });

    // Listen for updates
    socketRef.current.on('update', onUpdate);

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [channel, onUpdate]);

  return socketRef.current;
};