import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { WS_CONFIG } from '../config/websocket.js';

export class WebSocketManager {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws) => {
      ws.isAlive = true;
      console.log('Client connected');

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
          }

          // Handle other message types here
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error processing message:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, WS_CONFIG.HEARTBEAT_INTERVAL);
  }

  handleMessage(ws, message) {
    // Implement your message handling logic here
    // Example:
    switch (message.type) {
      case 'subscribe':
        // Handle subscription
        break;
      case 'unsubscribe':
        // Handle unsubscription
        break;
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Unknown message type' 
        }));
    }
  }

  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

// Export a function to create and attach WebSocket server to an HTTP server
export const createWebSocketServer = (app) => {
  const server = createServer(app);
  const wsManager = new WebSocketManager(server);
  return { server, wsManager };
};
