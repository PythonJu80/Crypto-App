import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import NotificationPanel from '../../frontend/components/Notifications/NotificationPanel';
import { mockSocket } from '../mocks/socket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
});

const renderWithClient = (ui) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

const server = setupServer(
  rest.get('/api/notifications/user/:userId', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: [] }));
  }),
  rest.patch('/api/notifications/:id/read', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  }),
  rest.post('/api/notifications/clear', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  queryClient.clear();
  sessionStorage.clear();
});
afterAll(() => server.close());

describe('Notification Integration', () => {
  describe('Real-time Updates', () => {
    it('should handle trade notifications in real-time', async () => {
      renderWithClient(<NotificationPanel userId={1} />);

      const tradeNotification = {
        type: 'trade',
        title: 'Trade Executed',
        message: 'Successfully bought 0.1 BTC at $50,000',
        timestamp: new Date().toISOString(),
        data: {
          symbol: 'BTC',
          amount: 0.1,
          price: 50000,
          type: 'buy'
        }
      };

      mockSocket.emit('notifications', {
        type: 'notification',
        data: tradeNotification
      });

      await waitFor(() => {
        expect(screen.getByText('Trade Executed')).toBeInTheDocument();
        const notification = screen.getByText('Trade Executed').closest('div');
        expect(notification).toHaveClass('border-pepe-primary');
        expect(notification).toHaveClass('animate-usb-pulse');
      });
    });

    it('should handle alert notifications with warning styling', async () => {
      renderWithClient(<NotificationPanel userId={1} />);

      const alertNotification = {
        type: 'alert',
        title: 'Price Alert',
        message: 'BTC reached target price of $50,000',
        timestamp: new Date().toISOString(),
        data: {
          symbol: 'BTC',
          targetPrice: 50000,
          currentPrice: 50100
        }
      };

      mockSocket.emit('notifications', {
        type: 'notification',
        data: alertNotification
      });

      await waitFor(() => {
        const notification = screen.getByText('Price Alert').closest('div');
        expect(notification).toHaveClass('border-pepe-warning');
      });
    });

    it('should handle error notifications with error styling', async () => {
      renderWithClient(<NotificationPanel userId={1} />);

      const errorNotification = {
        type: 'error',
        title: 'Connection Error',
        message: 'WebSocket connection lost',
        timestamp: new Date().toISOString()
      };

      mockSocket.emit('notifications', {
        type: 'notification',
        data: errorNotification
      });

      await waitFor(() => {
        const notification = screen.getByText('Connection Error').closest('div');
        expect(notification).toHaveClass('border-pepe-error');
      });
    });
  });

  describe('Filtering and Search', () => {
    it('should filter notifications by type', async () => {
      renderWithClient(<NotificationPanel userId={1} />);

      // Add mixed notifications
      mockSocket.emit('notifications', {
        type: 'notification',
        data: {
          type: 'trade',
          title: 'Trade Executed',
          message: 'Trade message'
        }
      });

      mockSocket.emit('notifications', {
        type: 'notification',
        data: {
          type: 'alert',
          title: 'Price Alert',
          message: 'Alert message'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Trade Executed')).toBeInTheDocument();
        expect(screen.getByText('Price Alert')).toBeInTheDocument();
      });

      // Filter by trades
      fireEvent.click(screen.getByText('Trades'));

      expect(screen.getByText('Trade Executed')).toBeInTheDocument();
      expect(screen.queryByText('Price Alert')).not.toBeInTheDocument();
    });

    it('should search notifications by content', async () => {
      const user = userEvent.setup();
      renderWithClient(<NotificationPanel userId={1} />);

      mockSocket.emit('notifications', {
        type: 'notification',
        data: {
          type: 'trade',
          title: 'BTC Trade',
          message: 'BTC trade executed'
        }
      });

      mockSocket.emit('notifications', {
        type: 'notification',
        data: {
          type: 'trade',
          title: 'ETH Trade',
          message: 'ETH trade executed'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('BTC Trade')).toBeInTheDocument();
        expect(screen.getByText('ETH Trade')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search notifications...');
      await user.type(searchInput, 'BTC');

      expect(screen.getByText('BTC Trade')).toBeInTheDocument();
      expect(screen.queryByText('ETH Trade')).not.toBeInTheDocument();
    });
  });

  describe('Session Persistence', () => {
    it('should persist notifications across page reloads', async () => {
      const { unmount } = renderWithClient(<NotificationPanel userId={1} />);

      mockSocket.emit('notifications', {
        type: 'notification',
        data: {
          type: 'trade',
          title: 'Persistent Trade',
          message: 'Should persist'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Persistent Trade')).toBeInTheDocument();
      });

      unmount();

      renderWithClient(<NotificationPanel userId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Persistent Trade')).toBeInTheDocument();
      });
    });

    it('should limit stored notifications to maximum count', async () => {
      renderWithClient(<NotificationPanel userId={1} />);

      // Add more than MAX_NOTIFICATIONS
      for (let i = 0; i < 105; i++) {
        mockSocket.emit('notifications', {
          type: 'notification',
          data: {
            type: 'trade',
            title: `Trade ${i}`,
            message: `Message ${i}`
          }
        });
      }

      await waitFor(() => {
        const notifications = screen.getAllByRole('heading', { level: 3 });
        expect(notifications).toHaveLength(100); // MAX_NOTIFICATIONS
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get('/api/notifications/user/:userId', (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      renderWithClient(<NotificationPanel userId={1} />);

      // Should still render and handle WebSocket updates
      mockSocket.emit('notifications', {
        type: 'notification',
        data: {
          type: 'trade',
          title: 'New Trade',
          message: 'Should still work'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('New Trade')).toBeInTheDocument();
      });
    });

    it('should handle WebSocket disconnection', async () => {
      renderWithClient(<NotificationPanel userId={1} />);

      mockSocket.emit('disconnect');

      await waitFor(() => {
        expect(screen.getByText('Connection Lost')).toBeInTheDocument();
      });

      mockSocket.emit('connect');

      await waitFor(() => {
        expect(screen.getByText('Connection Restored')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithClient(<NotificationPanel userId={1} />);

      mockSocket.emit('notifications', {
        type: 'notification',
        data: {
          type: 'trade',
          title: 'Test Trade',
          message: 'Keyboard test'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Trade')).toBeInTheDocument();
      });

      await user.tab();
      expect(screen.getByPlaceholderText('Search notifications...')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('All Types')).toHaveFocus();
    });

    it('should maintain focus when dismissing notifications', async () => {
      renderWithClient(<NotificationPanel userId={1} />);

      mockSocket.emit('notifications', {
        type: 'notification',
        data: {
          type: 'trade',
          title: 'Focus Test',
          message: 'Testing focus management'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Focus Test')).toBeInTheDocument();
      });

      const dismissButton = screen.getByLabelText('Dismiss notification');
      dismissButton.focus();
      fireEvent.click(dismissButton);

      expect(document.activeElement).toBe(dismissButton);
    });
  });
});