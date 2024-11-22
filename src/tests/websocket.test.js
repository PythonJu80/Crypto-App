import { WebSocket } from 'ws';
import express from 'express';
import { createWebSocketServer } from '../server/websocket';
import { WS_CONFIG } from '../config/websocket';

describe('WebSocket Server', () => {
  let server;
  let wsManager;
  let wsClient;
  const TEST_PORT = 3002;

  beforeAll((done) => {
    const app = express();
    const wsSetup = createWebSocketServer(app);
    server = wsSetup.server;
    wsManager = wsSetup.wsManager;
    
    server.listen(TEST_PORT, () => {
      wsClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
      wsClient.on('open', done);
    });
  });

  afterAll((done) => {
    if (wsClient) wsClient.close();
    server.close(done);
  });

  it('should handle ping/pong messages', (done) => {
    wsClient.send(JSON.stringify({ type: 'ping' }));
    
    wsClient.once('message', (data) => {
      const message = JSON.parse(data.toString());
      expect(message).toEqual({ type: 'pong' });
      done();
    });
  });

  it('should handle invalid messages', (done) => {
    wsClient.send('invalid json');
    
    wsClient.once('message', (data) => {
      const message = JSON.parse(data.toString());
      expect(message).toEqual({
        type: 'error',
        message: 'Invalid message format'
      });
      done();
    });
  });

  it('should handle unknown message types', (done) => {
    wsClient.send(JSON.stringify({ type: 'unknown' }));
    
    wsClient.once('message', (data) => {
      const message = JSON.parse(data.toString());
      expect(message).toEqual({
        type: 'error',
        message: 'Unknown message type'
      });
      done();
    });
  });
});
