import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import TradeHistoryPanel from '../../frontend/components/TradeHistory/TradeHistoryPanel';

const mockTrades = [
  {
    id: 1,
    symbol: 'BTC',
    type: 'buy',
    price: 50000,
    currentPrice: 55000,
    amount: 0.1
  },
  {
    id: 2,
    symbol: 'ETH',
    type: 'sell',
    price: 3000,
    currentPrice: 2800,
    amount: 1.5
  }
];

const server = setupServer(
  rest.get('/api/trades/user/:userId', (req, res, ctx) => {
    const offset = parseInt(req.url.searchParams.get('offset') || '0');
    const limit = parseInt(req.url.searchParams.get('limit') || '20');
    const type = req.url.searchParams.get('type');
    const period = req.url.searchParams.get('period');

    let filteredTrades = [...mockTrades];
    if (type) {
      filteredTrades = filteredTrades.filter(t => t.type === type);
    }

    return res(ctx.json({
      success: true,
      data: filteredTrades.slice(offset, offset + limit)
    }));
  })
);

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

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  queryClient.clear();
});
afterAll(() => server.close());

describe('TradeHistoryPanel', () => {
  it('should render trade history with PepeUSB theme', async () => {
    renderWithClient(<TradeHistoryPanel userId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Trade History')).toBeInTheDocument();
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    const container = screen.getByRole('heading', { name: /trade history/i })
      .parentElement;
    expect(container).toHaveClass('bg-pepe-dark/90', 'border-pepe-primary');
  });

  it('should filter trades by type', async () => {
    renderWithClient(<TradeHistoryPanel userId={1} />);

    await waitFor(() => {
      expect(screen.getByText('BTC')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Buy'));

    await waitFor(() => {
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.queryByText('ETH')).not.toBeInTheDocument();
    });
  });

  it('should handle empty trade history', async () => {
    server.use(
      rest.get('/api/trades/user/:userId', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: [] }));
      })
    );

    renderWithClient(<TradeHistoryPanel userId={1} />);

    await waitFor(() => {
      expect(screen.getByText('No trades found')).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    server.use(
      rest.get('/api/trades/user/:userId', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    renderWithClient(<TradeHistoryPanel userId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch trades')).toBeInTheDocument();
    });
  });

  it('should calculate and display profit/loss correctly', async () => {
    renderWithClient(<TradeHistoryPanel userId={1} />);

    await waitFor(() => {
      // BTC trade: (55000 - 50000) * 0.1 = +500
      expect(screen.getByText('+$500.00')).toBeInTheDocument();
      // ETH trade: (3000 - 2800) * 1.5 = +300
      expect(screen.getByText('+$300.00')).toBeInTheDocument();
    });
  });

  it('should apply hover effects to trade rows', async () => {
    renderWithClient(<TradeHistoryPanel userId={1} />);

    await waitFor(() => {
      const row = screen.getByText('BTC').closest('div');
      expect(row).toHaveClass('hover:bg-pepe-dark/50');
    });
  });
});