import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTradeHistory } from '../../hooks/useTradeHistory';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const FilterButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full font-['Press_Start_2P'] text-xs
                transition-all duration-300 ${
      active
        ? 'bg-pepe-primary text-pepe-dark'
        : 'bg-pepe-dark/50 text-pepe-primary hover:bg-pepe-dark/70'
    }`}
  >
    {label}
  </button>
);

const TradeRow = ({ trade, index }) => {
  const isProfitable = trade.type === 'buy' 
    ? trade.currentPrice > trade.price 
    : trade.price > trade.currentPrice;

  const profitLoss = trade.type === 'buy'
    ? (trade.currentPrice - trade.price) * trade.amount
    : (trade.price - trade.currentPrice) * trade.amount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group grid grid-cols-5 gap-4 p-4 border-b border-pepe-primary/20
                 hover:bg-pepe-dark/50 transition-all duration-300"
    >
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${
          isProfitable ? 'bg-pepe-primary' : 'bg-pepe-error'
        } group-hover:animate-usb-pulse`} />
        <span className="font-['Press_Start_2P'] text-sm text-pepe-primary">
          {trade.symbol}
        </span>
      </div>

      <span className={`text-sm ${
        trade.type === 'buy' ? 'text-pepe-primary' : 'text-pepe-error'
      }`}>
        {trade.type.toUpperCase()}
      </span>

      <span className="text-sm text-pepe-light">
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(trade.price)}
      </span>

      <span className="text-sm text-pepe-light">
        {trade.amount.toFixed(6)}
      </span>

      <span className={`text-sm ${
        isProfitable ? 'text-pepe-primary' : 'text-pepe-error'
      }`}>
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          signDisplay: 'always'
        }).format(profitLoss)}
      </span>
    </motion.div>
  );
};

const TradeHistoryPanel = ({ userId }) => {
  const {
    trades,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    activeFilters,
    updateFilters
  } = useTradeHistory(userId);

  const { ref: loadMoreRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorAlert message={error.message} />;

  return (
    <div className="bg-pepe-dark/90 rounded-lg border-2 border-pepe-primary p-6
                    shadow-pepe hover:shadow-pepe-hover transition-shadow duration-300">
      <h2 className="text-xl font-['Press_Start_2P'] text-pepe-primary mb-6 flex items-center">
        <span className="w-3 h-3 rounded-full bg-pepe-primary animate-usb-pulse mr-3" />
        Trade History
      </h2>

      <div className="flex space-x-4 mb-6 overflow-x-auto pb-2
                      scrollbar-thin scrollbar-thumb-pepe-primary scrollbar-track-pepe-dark">
        <FilterButton
          label="All"
          active={!activeFilters.type}
          onClick={() => updateFilters({ type: undefined })}
        />
        <FilterButton
          label="Buy"
          active={activeFilters.type === 'buy'}
          onClick={() => updateFilters({ type: 'buy' })}
        />
        <FilterButton
          label="Sell"
          active={activeFilters.type === 'sell'}
          onClick={() => updateFilters({ type: 'sell' })}
        />
        <FilterButton
          label="Last 24h"
          active={activeFilters.period === '24h'}
          onClick={() => updateFilters({ period: '24h' })}
        />
        <FilterButton
          label="Last Week"
          active={activeFilters.period === '7d'}
          onClick={() => updateFilters({ period: '7d' })}
        />
      </div>

      <div className="grid grid-cols-5 gap-4 p-4 border-b-2 border-pepe-primary mb-4">
        <span className="text-sm font-['Press_Start_2P'] text-pepe-light">Symbol</span>
        <span className="text-sm font-['Press_Start_2P'] text-pepe-light">Type</span>
        <span className="text-sm font-['Press_Start_2P'] text-pepe-light">Price</span>
        <span className="text-sm font-['Press_Start_2P'] text-pepe-light">Amount</span>
        <span className="text-sm font-['Press_Start_2P'] text-pepe-light">P/L</span>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto
                      scrollbar-thin scrollbar-thumb-pepe-primary scrollbar-track-pepe-dark">
        <AnimatePresence mode="popLayout">
          {trades.map((trade, index) => (
            <TradeRow
              key={trade.id}
              trade={trade}
              index={index}
            />
          ))}
        </AnimatePresence>

        {trades.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <p className="text-pepe-light text-sm animate-usb-pulse">
              No trades found
            </p>
          </div>
        )}

        <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="w-8 h-8">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeHistoryPanel;