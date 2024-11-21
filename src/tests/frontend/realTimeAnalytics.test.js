import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import RealTimeAnalytics from '../../frontend/components/Analytics/RealTimeAnalytics';
import { mockSocket } from '../mocks/socket';

const mockMetrics = {
  totalTrades: 1234,
  portfolioValue: 50000,
  activeAlerts: 5,
  dailyVolume: 500000,
  successRate: 85
};

const server = setupServer(
  rest.get('/api/metrics/summary', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: mockMetrics }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('RealTimeAnalytics Component', () => {
  it('should render initial metrics', async () => {
    render(<RealTimeAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('1,234')).toBeInTheDocument();
      expect(screen.getByText('$50,000.00')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should handle WebSocket updates', async () => {
    render(<RealTimeAnalytics />);

    const updatedMetrics = {
      ...mockMetrics,
      totalTrades: 1235,
      portfolioValue: 51000
    };

    mockSocket.emit('metrics', {
      type: 'metrics',
      data: updatedMetrics
    });

    await waitFor(() => {
      expect(screen.getByText('1,235')).toBeInTheDocument();
      expect(screen.getByText('$51,000.00')).toBeInTheDocument();
    });
  });

  it('should apply PepeUSB theme styles', () => {
    render(<RealTimeAnalytics />);

    const container = screen.getByRole('heading', { name: /real-time analytics/i })
      .parentElement;

    expect(container).toHaveClass('p-6');
    expect(container.querySelector('.border-pepe-primary')).toBeInTheDocument();
  });

  it('should show progress bars with correct values', async () => {
    render(<RealTimeAnalytics />);

    await waitFor(() => {
      const volumeBar = screen.getByText('Daily Volume')
        .parentElement.parentElement
        .querySelector('[class*="bg-pepe-primary"]');
      
      expect(volumeBar).toHaveStyle({
        width: '50%'  // 500000 / 1000000 * 100
      });
    });
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.get('/api/metrics/summary', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<RealTimeAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('should animate metrics changes', async () => {
    render(<RealTimeAnalytics />);

    const card = screen.getByText('Total Trades').parentElement;
    expect(card).toHaveStyle('opacity: 1');
    expect(card).toHaveStyle('transform: scale(1)');
  });
});