import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchDashboardData, transformDashboardData } from '../../api/portfolioApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import Summary from './Summary';
import HoldingsDistribution from './HoldingsDistribution';
import PerformanceChart from './PerformanceChart';
import ReinvestmentPanel from '../ReinvestmentControls/ReinvestmentPanel';
import FeedbackButton from '../common/FeedbackButton';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const PortfolioDashboard = ({ userId }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['portfolioDashboard', userId],
    queryFn: () => fetchDashboardData(userId),
    select: transformDashboardData,
    refetchInterval: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  useWebSocket(`portfolio-${userId}`, (update) => {
    queryClient.invalidateQueries(['portfolioDashboard', userId]);
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorAlert 
        message={error.message}
        onRetry={refetch}
      />
    );
  }

  return (
    <div 
      className="min-h-screen bg-pepe-dark"
      role="main"
      aria-label="Portfolio Dashboard"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-['Press_Start_2P'] text-pepe-primary mb-8"
        >
          Portfolio Dashboard
        </motion.h1>

        <div className="space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pepe-card"
            >
              <Summary data={data.summary} />
            </motion.div>

            <motion.div
              key="charts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              data-testid="dashboard-grid"
            >
              <div 
                className="pepe-card hover:shadow-pepe-hover transition-shadow duration-300"
                role="region"
                aria-label="Holdings Distribution"
              >
                <HoldingsDistribution data={data.holdings} />
              </div>
              <div 
                className="pepe-card hover:shadow-pepe-hover transition-shadow duration-300"
                role="region"
                aria-label="Performance Overview"
              >
                <PerformanceChart data={data.performance} />
              </div>
            </motion.div>

            <motion.div
              key="reinvestment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full"
            >
              <ReinvestmentPanel userId={userId} />
            </motion.div>

            <motion.div
              key="timestamp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-right text-pepe-light text-sm font-['Press_Start_2P']"
            >
              <time dateTime={data.lastUpdated}>
                Last updated: {new Date(data.lastUpdated).toLocaleString()}
              </time>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <FeedbackButton />
    </div>
  );
};