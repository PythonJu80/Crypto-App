import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API endpoints
export const server = setupServer(
  // Notifications API
  rest.get('/api/notifications/user/:userId', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      data: []
    }));
  }),

  rest.patch('/api/notifications/:id/read', (req, res, ctx) => {
    return res(ctx.json({
      success: true
    }));
  }),

  rest.post('/api/notifications/clear', (req, res, ctx) => {
    return res(ctx.json({
      success: true
    }));
  }),

  // WebSocket mock is handled by mockSocket in socket.js
  rest.get('/api/ws', (req, res, ctx) => {
    return res(ctx.status(101)); // WebSocket upgrade
  })
);