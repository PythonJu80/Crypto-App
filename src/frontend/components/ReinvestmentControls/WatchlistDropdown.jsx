import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const WatchlistDropdown = ({ selectedCoins, onSelectionChange }) => {
  const [availableCoins, setAvailableCoins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/market/top-coins')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAvailableCoins(data.data);
        } else {
          throw new Error('Failed to fetch coins');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggleCoin = (coin) => {
    const newSelection = selectedCoins.includes(coin)
      ? selectedCoins.filter(c => c !== coin)
      : [...selectedCoins, coin];
    onSelectionChange(newSelection);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="w-6 h-6 border-2 border-pepe-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-pepe-error text-sm p-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-['Press_Start_2P'] text-pepe-light">
        Watchlist Coins
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {availableCoins.map(coin => (
          <motion.button
            key={coin.symbol}
            onClick={() => handleToggleCoin(coin.symbol)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-2 rounded-lg border-2 transition-colors duration-200 ${
              selectedCoins.includes(coin.symbol)
                ? 'border-pepe-primary bg-pepe-dark/70 text-pepe-primary'
                : 'border-pepe-dark/50 bg-pepe-dark/30 text-pepe-light hover:border-pepe-primary/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-xs">{coin.symbol}</span>
              <span className={`text-xs ${
                coin.priceChange24h >= 0 ? 'text-pepe-primary' : 'text-pepe-error'
              }`}>
                {coin.priceChange24h >= 0 ? '↑' : '↓'}
                {Math.abs(coin.priceChange24h).toFixed(2)}%
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default WatchlistDropdown;