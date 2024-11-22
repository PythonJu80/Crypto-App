export const WS_CONFIG = {
  HEARTBEAT_INTERVAL: 30000,
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_TIMEOUT: 5000
};

export const getWebSocketUrl = () => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = process.env.NODE_ENV === 'production'
    ? process.env.VITE_WS_HOST
    : `${window.location.hostname}:3001`;
    
  return `${wsProtocol}//${wsHost}/ws`;
};
