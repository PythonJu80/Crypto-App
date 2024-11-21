import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import WatchlistDropdown from '../../frontend/components/ReinvestmentControls/WatchlistDropdown';

const mockCoins = [
  { symbol: 'BTC', priceChange24h: 2.5 },
  { symbol: 'ETH', priceChange24h: -1.8 },
  { symbol: 'DOT', priceChange24h: 3.2 }
];

const server = setupServer(
  rest.get('/api/market/top-coins', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: mockCoins }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('WatchlistDropdown', () => {
  it('should render available coins', async () => {
    render(
      <WatchlistDropdown
        selectedCoins={[]}
        onSelectionChange={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('DOT')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    render(
      <WatchlistDropdown
        selectedCoins={[]}
        onSelectionChange={() => {}}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should handle coin selection', async () => {
    const handleChange = jest.fn();
    render(
      <WatchlistDropdown
        selectedCoins={[]}
        onSelectionChange={handleChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('BTC')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('BTC'));
    expect(handleChange).toHaveBeenCalledWith(['BTC']);
  });

  it('should handle coin deselection', async () => {
    const handleChange = jest.fn();
    render(
      <WatchlistDropdown
        selectedCoins={['BTC']}
        onSelectionChange={handleChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('BTC')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('BTC'));
    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('should display price changes with correct styling', async () => {
    render(
      <WatchlistDropdown
        selectedCoins={[]}
        onSelectionChange={() => {}}
      />
    );

    await waitFor(() => {
      const btcChange = screen.getByText('↑2.50%');
      const ethChange = screen.getByText('↓1.80%');
      
      expect(btcChange).toHaveClass('text-pepe-primary');
      expect(ethChange).toHaveClass('text-pepe-error');
    });
  });

  it('should handle API errors', async () => {
    server.use(
      rest.get('/api/market/top-coins', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(
      <WatchlistDropdown
        selectedCoins={[]}
        onSelectionChange={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch coins')).toBeInTheDocument();
    });
  });

  it('should apply PepeUSB theme styling', async () => {
    render(
      <WatchlistDropdown
        selectedCoins={['BTC']}
        onSelectionChange={() => {}}
      />
    );

    await waitFor(() => {
      const selectedCoin = screen.getByText('BTC').closest('button');
      expect(selectedCoin).toHaveClass('border-pepe-primary', 'bg-pepe-dark/70');
    });
  });
});