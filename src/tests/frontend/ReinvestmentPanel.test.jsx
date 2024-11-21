import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ReinvestmentPanel from '../../frontend/components/ReinvestmentControls/ReinvestmentPanel';
import { mockSocket } from '../mocks/socket';

const mockSettings = {
  isAutomated: true,
  profitThreshold: 5,
  shortTermAllocation: 70,
  longTermAllocation: 30
};

const server = setupServer(
  rest.get('/api/reinvestment/settings/:userId', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: mockSettings }));
  }),
  rest.put('/api/reinvestment/settings/:userId', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockSocket.disconnect();
});
afterAll(() => server.close());

describe('ReinvestmentPanel', () => {
  it('should render with initial settings', async () => {
    render(<ReinvestmentPanel userId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Reinvestment Controls')).toBeInTheDocument();
      expect(screen.getByText('Automated Reinvestment')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument(); // Short-term allocation
      expect(screen.getByText('Long-term: 30%')).toBeInTheDocument();
    });
  });

  it('should toggle automation mode', async () => {
    const user = userEvent.setup();
    render(<ReinvestmentPanel userId={1} />);

    const toggle = await screen.findByRole('switch');
    await user.click(toggle);

    expect(toggle).not.toBeChecked();
    expect(screen.getByText('Manual Mode')).toBeInTheDocument();
  });

  it('should update profit threshold', async () => {
    render(<ReinvestmentPanel userId={1} />);

    const slider = await screen.findByLabelText('Profit Threshold');
    fireEvent.change(slider, { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.getByText('10%')).toBeInTheDocument();
    });
  });

  it('should update allocations', async () => {
    render(<ReinvestmentPanel userId={1} />);

    const slider = await screen.findByLabelText('Short-term Allocation');
    fireEvent.change(slider, { target: { value: '60' } });

    await waitFor(() => {
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('Long-term: 40%')).toBeInTheDocument();
    });
  });

  it('should handle WebSocket updates', async () => {
    render(<ReinvestmentPanel userId={1} />);

    const updatedSettings = {
      ...mockSettings,
      shortTermAllocation: 80,
      longTermAllocation: 20
    };

    mockSocket.emit('reinvestment', {
      type: 'settings',
      data: updatedSettings
    });

    await waitFor(() => {
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('Long-term: 20%')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.put('/api/reinvestment/settings/:userId', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<ReinvestmentPanel userId={1} />);

    const slider = await screen.findByLabelText('Profit Threshold');
    fireEvent.change(slider, { target: { value: '15' } });

    // Component should still update locally despite API error
    await waitFor(() => {
      expect(screen.getByText('15%')).toBeInTheDocument();
    });
  });

  it('should apply PepeUSB theme styling', async () => {
    render(<ReinvestmentPanel userId={1} />);

    const panel = screen.getByText('Reinvestment Controls').closest('div');
    expect(panel).toHaveClass('bg-pepe-dark/90', 'border-pepe-primary');

    const sliders = await screen.findAllByRole('slider');
    sliders.forEach(slider => {
      expect(slider).toHaveClass('bg-pepe-dark');
    });
  });
});