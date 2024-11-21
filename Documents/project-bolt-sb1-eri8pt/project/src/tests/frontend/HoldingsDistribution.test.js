import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HoldingsDistribution from '../../frontend/components/PortfolioDashboard/HoldingsDistribution';

describe('HoldingsDistribution Component', () => {
  const mockData = {
    chartData: [
      { name: 'BTC', value: 60, rawValue: 30000 },
      { name: 'ETH', value: 30, rawValue: 15000 },
      { name: 'DOT', value: 10, rawValue: 5000 }
    ],
    top: [
      { symbol: 'BTC', value: 30000, allocation: 60 },
      { symbol: 'ETH', value: 15000, allocation: 30 },
      { symbol: 'DOT', value: 5000, allocation: 10 }
    ]
  };

  it('should render pie chart and holdings list', () => {
    render(<HoldingsDistribution data={mockData} />);

    expect(screen.getByText('Holdings Distribution')).toBeInTheDocument();
    expect(screen.getByText('Top Holdings')).toBeInTheDocument();
    
    mockData.top.forEach(holding => {
      expect(screen.getByText(holding.symbol)).toBeInTheDocument();
      expect(screen.getByText(`${holding.allocation.toFixed(2)}%`)).toBeInTheDocument();
    });
  });

  it('should show tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<HoldingsDistribution data={mockData} />);

    const chartSegment = screen.getByRole('region').querySelector('path');
    await user.hover(chartSegment);

    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('Allocation: 60.00%')).toBeInTheDocument();
    expect(screen.getByText('Value: $30,000.00')).toBeInTheDocument();
  });

  it('should highlight chart segment on hover', async () => {
    const user = userEvent.setup();
    render(<HoldingsDistribution data={mockData} />);

    const chartSegment = screen.getByRole('region').querySelector('path');
    await user.hover(chartSegment);

    expect(chartSegment).toHaveStyle('opacity: 0.8');
    
    await user.unhover(chartSegment);
    expect(chartSegment).toHaveStyle('opacity: 1');
  });

  it('should be responsive', () => {
    render(<HoldingsDistribution data={mockData} />);
    
    const container = screen.getByRole('region');
    expect(container).toHaveClass('h-64');
    
    const list = screen.getByText('Top Holdings').parentElement;
    expect(list).toHaveClass('space-y-3');
  });

  it('should handle empty data gracefully', () => {
    const emptyData = {
      chartData: [],
      top: []
    };

    render(<HoldingsDistribution data={emptyData} />);
    expect(screen.getByText('Holdings Distribution')).toBeInTheDocument();
    expect(screen.getByText('Top Holdings')).toBeInTheDocument();
  });

  it('should maintain aspect ratio', () => {
    render(<HoldingsDistribution data={mockData} />);
    
    const chartContainer = screen.getByRole('region').querySelector('[class*="recharts-responsive-container"]');
    expect(chartContainer).toHaveAttribute('width', '100%');
    expect(chartContainer).toHaveAttribute('height', '100%');
  });
});