import React, { Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchDashboardData, transformDashboardData } from '../../api/portfolioApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import Summary from './Summary';
import ReinvestmentPanel from '../ReinvestmentControls/ReinvestmentPanel';
import FeedbackButton from '../common/FeedbackButton';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

// Lazy load chart components
const HoldingsDistribution = lazy(() => import('./HoldingsDistribution'));
const PerformanceChart = lazy(() => import('./PerformanceChart'));

const ChartLoadingFallback = () => (
  <div className="flex items-center justify-center h-64 bg-pepe-dark/90 rounded-lg border-2 border-pepe-primary">
    <LoadingSpinner size="medium" message="Loading chart..." />
  </div>
);

const PortfolioDashboard = ({ userId }) => {
  const queryClient = useQueryClient();
  
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
            {isLoading ? (
              <LoadingSpinner size="large" message="Loading dashboard..." />
            ) : error ? (
              <ErrorAlert 
                message={error.message}
                onRetry={refetch}
              />
            ) : (
              <React.Fragment>
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
                    <Suspense fallback={<ChartLoadingFallback />}>
                      <HoldingsDistribution data={data.holdings} />
                    </Suspense>
                  </div>
                  <div 
                    className="pepe-card hover:shadow-pepe-hover transition-shadow duration-300"
                    role="region"
                    aria-label="Performance Overview"
                  >
                    <Suspense fallback={<ChartLoadingFallback />}>
                      <PerformanceChart data={data.performance} />
                    </Suspense>
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
              </React.Fragment>
            )}
          </AnimatePresence>
        </div>
      </div>

      <FeedbackButton />
    </div>
  );
};

PortfolioDashboard.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default PortfolioDashboard;