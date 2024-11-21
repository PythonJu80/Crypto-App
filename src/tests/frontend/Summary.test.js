import React from 'react';
import { render, screen } from '@testing-library/react';
import Summary from '../../frontend/components/PortfolioDashboard/Summary';

describe('Summary Component', () => {
  const mockData = {
    totalValueFormatted: '$50,000.00',
    profitLossFormatted: '+$5,000.00',
    profitLoss: 5000,
    profitLossPercentage: 10,
    totalAssets: 3,
    largestHolding: {
      symbol: 'BTC',
      allocation: 60
    }
  };

  it('should render all summary information', () => {
    render(<Summary data={mockData} />);

    expect(screen.getByText('Portfolio Summary')).toBeInTheDocument();
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
    expect(screen.getByText('+$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('10.00%')).toBeInTheDocument();
  });

  it('should use correct colors for profit/loss', () => {
    render(<Summary data={mockData} />);
    
    const profitElement = screen.getByText('+$5,000.00');
    expect(profitElement).toHaveClass('text-green-400');

    // Test loss scenario
    const lossData = {
      ...mockData,
      profitLoss: -5000,
      profitLossFormatted: '-$5,000.00'
    };

    render(<Summary data={lossData} />);
    const lossElement = screen.getByText('-$5,000.00');
    expect(lossElement).toHaveClass('text-red-400');
  });

  it('should handle missing largest holding', () => {
    const dataWithoutHolding = {
      ...mockData,
      largestHolding: null
    };

    render(<Summary data={dataWithoutHolding} />);
    expect(screen.queryByText('Largest Holding')).not.toBeInTheDocument();
  });

  it('should be responsive', () => {
    render(<Summary data={mockData} />);
    
    const container = screen.getByText('Portfolio Summary').parentElement;
    expect(container).toHaveClass('p-6');
    
    const grid = container.querySelector('[class*="grid-cols-2"]');
    expect(grid).toBeInTheDocument();
  });
});