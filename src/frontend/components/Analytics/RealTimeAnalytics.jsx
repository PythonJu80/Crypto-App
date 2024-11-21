import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealTimeMetrics } from '../../hooks/useRealTimeMetrics';

const MetricCard = ({ title, value, icon: Icon, trend }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-money-dark rounded-lg p-4 border-2 border-pepe-primary
               shadow-money hover:shadow-money-hover transition-all duration-300"
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm text-pepe-light">{title}</h3>
      <Icon className="w-5 h-5 text-pepe-primary animate-money-pulse" />
    </div>
    
    <div className="flex items-baseline space-x-2">
      <span className="text-xl font-['Roboto_Mono'] text-pepe-primary">
        {value}
      </span>
      {trend && (
        <span className={`text-sm ${
          trend > 0 ? 'text-pepe-primary' : 'text-pepe-error'
        }`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  </motion.div>
);

const ProgressBar = ({ value, max, color = 'pepe-primary' }) => (
  <div className="h-2 bg-pepe-dark/50 rounded-full overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${(value / max) * 100}%` }}
      transition={{ duration: 0.5 }}
      className={`h-full bg-${color} animate-money-pulse`}
    />
  </div>
);

const RealTimeAnalytics = () => {
  const metrics = useRealTimeMetrics();

  return (
    <div className="p-6">
      <h2 className="text-xl font-['Roboto_Mono'] text-pepe-primary mb-6 flex items-center">
        <span className="w-3 h-3 rounded-full bg-pepe-primary animate-money-spin mr-3">$</span>
        Real-Time Analytics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Trades"
          value={metrics.totalTrades.toLocaleString()}
          icon={() => (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )}
        />

        <MetricCard
          title="Portfolio Value"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(metrics.portfolioValue)}
          icon={() => (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          trend={2.5}
        />

        <MetricCard
          title="Active Alerts"
          value={metrics.activeAlerts}
          icon={() => (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          )}
        />
      </div>

      <div className="mt-8 space-y-6">
        <div className="bg-money-dark rounded-lg p-4 border-2 border-pepe-primary">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm text-pepe-light">Daily Volume</h3>
            <span className="text-pepe-primary">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact'
              }).format(metrics.dailyVolume)}
            </span>
          </div>
          <ProgressBar value={metrics.dailyVolume} max={1000000} />
        </div>

        <div className="bg-money-dark rounded-lg p-4 border-2 border-pepe-primary">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm text-pepe-light">Success Rate</h3>
            <span className="text-pepe-primary">
              {metrics.successRate}%
            </span>
          </div>
          <ProgressBar 
            value={metrics.successRate} 
            max={100}
            color={metrics.successRate >= 80 ? 'pepe-primary' : 'pepe-warning'}
          />
        </div>
      </div>
    </div>
  );
};

export default RealTimeAnalytics;