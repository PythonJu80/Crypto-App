import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PerformanceChart from '../../frontend/components/PortfolioDashboard/PerformanceChart';

describe('PerformanceChart Component', () => {
  const mockData = {
    chartData: [
      { symbol: 'BTC', value: 15, profitLoss: 4000 },
      { symbol: 'ETH', value: 5, profitLoss: 1000 },
      { symbol: 'DOT', value: -10, profitLoss: -2000 }
    ],
    tradeCount: 8,
    volume: 100000
  };

  it('should render bar chart and metrics', () => {
    render(<PerformanceChart data={mockData} />);

    expect(screen.getByText('Performance Overview')).toBeInTheDocument();
    expect(screen.getByText('Trade Count')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('$100K')).toBeInTheDocument();
  });

  it('should show tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<PerformanceChart data={mockData} />);

    const bar = screen.getByRole('region').querySelector('.recharts-bar-rectangle');
    await user.hover(bar);

    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('Performance: 15.00%')).toBeInTheDocument();
    expect(screen.getByText('Profit/Loss: +$4,000.00')).toBeInTheDocument();
  });

  it('should use correct colors for positive/negative values', () => {
    render(<PerformanceChart data={mockData} />);
    
    const bars = screen.getByRole('region').querySelectorAll('.recharts-bar-rectangle');
    
    // Positive value (BTC)
    expect(bars[0]).toHaveAttribute('fill', '#F3BA2F');
    
    // Negative value (DOT)
    expect(bars[2]).toHaveAttribute('fill', '#FF4D4F');
  });

  it('should handle hover interactions', async () => {
    const user = userEvent.setup();
    render(<PerformanceChart data={mockData} />);

    const bar = screen.getByRole('region').querySelector('.recharts-bar-rectangle');
    await user.hover(bar);
    expect(bar).toHaveStyle('opacity: 0.8');
    
    await user.unhover(bar);
    expect(bar).toHaveStyle('opacity: 1');
  });

  it('should format numbers correctly', () => {
    render(<PerformanceChart data={mockData} />);
    
    // Volume should be formatted in compact notation
    expect(screen.getByText('$100K')).toBeInTheDocument();
    
    // Trade count should be a plain number
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should maintain responsive layout', () => {
    render(<PerformanceChart data={mockData} />);
    
    const container = screen.getByRole('region');
    expect(container).toHaveClass('h-64');
    
    const metrics = container.querySelector('[class*="grid-cols-2"]');
    expect(metrics).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    const emptyData = {
      chartData: [],
      tradeCount: 0,
      volume: 0
    };

    render(<PerformanceChart data={emptyData} />);
    expect(screen.getByText('Performance Overview')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('should maintain chart aspect ratio', () => {
    render(<PerformanceChart data={mockData} />);
    
    const chartContainer = screen.getByRole('region').querySelector('[class*="recharts-responsive-container"]');
    expect(chartContainer).toHaveAttribute('width', '100%');
    expect(chartContainer).toHaveAttribute('height', '100%');
  });
});