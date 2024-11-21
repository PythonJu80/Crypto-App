import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import PortfolioDashboard from '../../frontend/components/PortfolioDashboard';
import { mockSocket } from '../mocks/socket';

expect.extend(toHaveNoViolations);

const mockData = {
  summary: {
    totalValue: 50000,
    totalValueFormatted: '$50,000.00',
    profitLoss: 5000,
    profitLossFormatted: '+$5,000.00',
    profitLossPercentage: 10,
    totalAssets: 3,
    largestHolding: {
      symbol: 'BTC',
      allocation: 60
    }
  },
  holdings: {
    top: [
      { symbol: 'BTC', value: 30000, allocation: 60 },
      { symbol: 'ETH', value: 15000, allocation: 30 },
      { symbol: 'DOT', value: 5000, allocation: 10 }
    ],
    chartData: [
      { name: 'BTC', value: 60 },
      { name: 'ETH', value: 30 },
      { name: 'DOT', value: 10 }
    ]
  },
  performance: {
    timeframe: '24h',
    profitLoss: 5000,
    profitLossPercentage: 10,
    tradeCount: 8,
    volume: 100000,
    chartData: [
      { symbol: 'BTC', value: 15, profitLoss: 4000 },
      { symbol: 'ETH', value: 5, profitLoss: 1000 }
    ]
  },
  lastUpdated: new Date().toISOString()
};

const server = setupServer(
  rest.get('/api/portfolio/dashboard/:userId', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: mockData }));
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  queryClient.clear();
});
afterAll(() => server.close());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0
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

describe('PortfolioDashboard', () => {
  describe('Component Rendering', () => {
    it('should render all dashboard sections with Binance theme', async () => {
      renderWithClient(<PortfolioDashboard userId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio Dashboard')).toHaveClass('text-binance-yellow');
        expect(screen.getByRole('main')).toHaveClass('bg-binance-black');
        expect(screen.getByText('Holdings Distribution')).toBeInTheDocument();
        expect(screen.getByText('Performance Overview')).toBeInTheDocument();
      });
    });

    it('should apply Binance-themed animations', async () => {
      renderWithClient(<PortfolioDashboard userId={1} />);

      const summary = await screen.findByText('Portfolio Summary');
      expect(summary.parentElement).toHaveStyle({
        transform: 'scale(1)',
        opacity: '1'
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should handle WebSocket updates smoothly', async () => {
      renderWithClient(<PortfolioDashboard userId={1} />);

      await waitFor(() => {
        expect(screen.getByText('$50,000.00')).toBeInTheDocument();
      });

      const updatedData = {
        ...mockData,
        summary: {
          ...mockData.summary,
          totalValue: 55000,
          totalValueFormatted: '$55,000.00'
        }
      };

      // Simulate WebSocket update
      mockSocket.emit('update', updatedData);

      await waitFor(() => {
        expect(screen.getByText('$55,000.00')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should maintain smooth animations during updates', async () => {
      renderWithClient(<PortfolioDashboard userId={1} />);

      const performanceChart = await screen.findByRole('region', {
        name: 'Performance Overview'
      });

      const initialTransform = window.getComputedStyle(performanceChart).transform;

      mockSocket.emit('update', mockData);

      await waitFor(() => {
        const newTransform = window.getComputedStyle(performanceChart).transform;
        expect(newTransform).toBe(initialTransform);
      });
    });
  });

  describe('Integration with Trading Service', () => {
    it('should update after trade execution', async () => {
      renderWithClient(<PortfolioDashboard userId={1} />);

      // Simulate trade execution update
      const tradeUpdate = {
        ...mockData,
        summary: {
          ...mockData.summary,
          totalValue: 52000,
          totalValueFormatted: '$52,000.00',
          profitLoss: 7000,
          profitLossFormatted: '+$7,000.00'
        }
      };

      mockSocket.emit('trade_executed', tradeUpdate);

      await waitFor(() => {
        expect(screen.getByText('$52,000.00')).toBeInTheDocument();
        expect(screen.getByText('+$7,000.00')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should load and render within performance budget', async () => {
      const startTime = performance.now();

      renderWithClient(<PortfolioDashboard userId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio Dashboard')).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(1000); // Should load within 1 second
    });

    it('should handle rapid data updates efficiently', async () => {
      renderWithClient(<PortfolioDashboard userId={1} />);

      const updates = Array.from({ length: 10 }, (_, i) => ({
        ...mockData,
        summary: {
          ...mockData.summary,
          totalValue: 50000 + (i * 1000),
          totalValueFormatted: `$${(50000 + (i * 1000)).toLocaleString()}.00`
        }
      }));

      const updatePromises = updates.map((update, i) => {
        return new Promise(resolve => {
          setTimeout(() => {
            mockSocket.emit('update', update);
            resolve();
          }, i * 100);
        });
      });

      await Promise.all(updatePromises);

      // Verify final update rendered correctly
      await waitFor(() => {
        expect(screen.getByText('$59,000.00')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get('/api/portfolio/dashboard/:userId', (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      renderWithClient(<PortfolioDashboard userId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();
        expect(screen.getByText('Try again')).toBeInTheDocument();
      });

      // Restore successful response
      server.use(
        rest.get('/api/portfolio/dashboard/:userId', (req, res, ctx) => {
          return res(ctx.json({ success: true, data: mockData }));
        })
      );

      // Click retry button
      fireEvent.click(screen.getByText('Try again'));

      await waitFor(() => {
        expect(screen.getByText('Portfolio Dashboard')).toBeInTheDocument();
      });
    });

    it('should recover from WebSocket disconnection', async () => {
      renderWithClient(<PortfolioDashboard userId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio Dashboard')).toBeInTheDocument();
      });

      mockSocket.emit('disconnect');

      // Simulate reconnection
      mockSocket.emit('connect');
      mockSocket.emit('update', mockData);

      // Verify data still updates
      await waitFor(() => {
        expect(screen.getByText('$50,000.00')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and UX', () => {
    it('should meet WCAG standards', async () => {
      const { container } = renderWithClient(<PortfolioDashboard userId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio Dashboard')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithClient(<PortfolioDashboard userId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio Dashboard')).toBeInTheDocument();
      });

      await user.tab();
      expect(screen.getByRole('region', { name: 'Holdings Distribution' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('region', { name: 'Performance Overview' })).toHaveFocus();
    });

    it('should maintain focus during updates', async () => {
      renderWithClient(<PortfolioDashboard userId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio Dashboard')).toBeInTheDocument();
      });

      const chart = screen.getByRole('region', { name: 'Holdings Distribution' });
      chart.focus();

      mockSocket.emit('update', mockData);

      await waitFor(() => {
        expect(chart).toHaveFocus();
      });
    });
  });
});