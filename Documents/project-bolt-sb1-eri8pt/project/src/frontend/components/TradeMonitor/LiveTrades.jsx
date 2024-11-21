import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveTrades } from '../../hooks/useLiveTrades';

const TradeRow = ({ trade, index }) => {
  const isProfitable = trade.type === 'buy';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center justify-between p-3 border-b border-pepe-primary/20
                 hover:bg-pepe-dark/50 transition-colors duration-300"
    >
      <div className="flex items-center space-x-4">
        <div className={`w-2 h-2 rounded-full animate-usb-pulse
          ${isProfitable ? 'bg-pepe-primary' : 'bg-pepe-error'}`} 
        />
        <span className="font-['Press_Start_2P'] text-sm text-pepe-primary">
          {trade.symbol}
        </span>
      </div>
      
      <div className="flex items-center space-x-6">
        <span className={`text-sm ${isProfitable ? 'text-pepe-primary' : 'text-pepe-error'}`}>
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
      </div>
    </motion.div>
  );
};

const LiveTrades = () => {
  const trades = useLiveTrades();
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [trades]);

  return (
    <div className="bg-pepe-dark/90 rounded-lg border-2 border-pepe-primary p-4
                    shadow-pepe hover:shadow-pepe-hover transition-shadow duration-300">
      <h2 className="text-xl font-['Press_Start_2P'] text-pepe-primary mb-4 flex items-center">
        <span className="w-3 h-3 rounded-full bg-pepe-primary animate-usb-pulse mr-3" />
        Live Trades
      </h2>
      
      <div
        ref={containerRef}
        className="h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-pepe-primary
                   scrollbar-track-pepe-dark"
      >
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
          <div className="flex items-center justify-center h-full">
            <p className="text-pepe-light text-sm animate-usb-pulse">
              Waiting for trades...
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-right">
        <span className="text-xs text-pepe-light font-['Press_Start_2P'] animate-usb-pulse">
          {trades.length} trades
        </span>
      </div>
    </div>
  );
};

export default LiveTrades;