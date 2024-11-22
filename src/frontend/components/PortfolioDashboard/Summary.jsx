import React from 'react';
import PropTypes from 'prop-types';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const Summary = ({ data }) => {
  const isProfitable = data.profitLoss >= 0;

  return (
    <div className="p-6">
      <h2 className="text-xl font-['Press_Start_2P'] mb-6 text-pepe-primary">
        Portfolio Summary
      </h2>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-pepe-dark/90 rounded-lg p-4 border-2 border-pepe-primary animate-usb-pulse">
          <p className="text-pepe-light mb-2">Total Value</p>
          <p className="text-2xl font-['Press_Start_2P'] text-pepe-primary">
            {data.totalValueFormatted}
          </p>
        </div>
        
        <div className="bg-pepe-dark/90 rounded-lg p-4 border-2 border-pepe-primary animate-usb-pulse">
          <p className="text-pepe-light mb-2">Profit/Loss</p>
          <div className="flex items-center space-x-2">
            {isProfitable ? (
              <ArrowUpIcon className="w-5 h-5 text-pepe-primary" />
            ) : (
              <ArrowDownIcon className="w-5 h-5 text-pepe-error" />
            )}
            <p className={`text-2xl font-['Press_Start_2P'] ${
              isProfitable ? 'text-pepe-primary' : 'text-pepe-error'
            }`}>
              {data.profitLossFormatted}
            </p>
          </div>
          <p className="text-sm text-pepe-light mt-1">
            {data.profitLossPercentage.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-8">
        <div className="bg-pepe-dark/90 rounded-lg p-4 border-2 border-pepe-primary animate-usb-pulse">
          <p className="text-pepe-light mb-2">Total Assets</p>
          <p className="text-xl font-['Press_Start_2P'] text-pepe-primary">
            {data.totalAssets}
          </p>
        </div>
        
        {data.largestHolding && (
          <div className="bg-pepe-dark/90 rounded-lg p-4 border-2 border-pepe-primary animate-usb-pulse">
            <p className="text-pepe-light mb-2">Largest Holding</p>
            <p className="text-xl font-['Press_Start_2P'] text-pepe-primary">
              {data.largestHolding.symbol}
            </p>
            <p className="text-sm text-pepe-light mt-1">
              {data.largestHolding.allocation.toFixed(2)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

Summary.propTypes = {
  data: PropTypes.shape({
    totalValueFormatted: PropTypes.string.isRequired,
    profitLoss: PropTypes.number.isRequired,
    profitLossFormatted: PropTypes.string.isRequired,
    profitLossPercentage: PropTypes.number.isRequired,
    totalAssets: PropTypes.number.isRequired,
    largestHolding: PropTypes.shape({
      symbol: PropTypes.string.isRequired,
      allocation: PropTypes.number.isRequired,
    }),
  }).isRequired,
};

export default Summary;