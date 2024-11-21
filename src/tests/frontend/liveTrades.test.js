import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import LiveTrades from '../../frontend/components/TradeMonitor/LiveTrades';
import { mockSocket } from '../mocks/socket';

const mockTrades = [
  {
    id: 1,
    symbol: 'BTC',
    type: 'buy',
    price: 50000,
    amount: 0.1
  },
  {
    id: 2,
    symbol: 'ETH',
    type: 'sell',
    price: 3000,
    amount: 1.5
  }
];

const server = setupServer(
  rest.get('/api/trades/recent', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: mockTrades }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('LiveTrades Component', () => {
  it('should render initial trades', async () => {
    render(<LiveTrades />);

    await waitFor(() => {
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });
  });

  it('should handle new trades via WebSocket', async () => {
    render(<LiveTrades />);

    const newTrade = {
      id: 3,
      symbol: 'DOT',
      type: 'buy',
      price: 20,
      amount: 100
    };

    mockSocket.emit('trades', {
      type: 'trade',
      data: newTrade
    });

    await waitFor(() => {
      expect(screen.getByText('DOT')).toBeInTheDocument();
    });
  });

  it('should show loading state when empty', async () => {
    server.use(
      rest.get('/api/trades/recent', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: [] }));
      })
    );

    render(<LiveTrades />);

    expect(screen.getByText('Waiting for trades...')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.get('/api/trades/recent', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<LiveTrades />);

    expect(screen.getByText('Waiting for trades...')).toBeInTheDocument();
  });

  it('should apply PepeUSB theme styles', () => {
    render(<LiveTrades />);

    const container = screen.getByRole('heading', { name: /live trades/i })
      .parentElement;

    expect(container).toHaveClass('bg-pepe-dark/90', 'border-pepe-primary');
  });

  it('should maintain scroll position on new trades', async () => {
    render(<LiveTrades />);

    await waitFor(() => {
      expect(screen.getByText('BTC')).toBeInTheDocument();
    });

    const container = screen.getByRole('heading', { name: /live trades/i })
      .parentElement.querySelector('[class*="overflow-y-auto"]');

    expect(container.scrollTop).toBe(0);
  });
});