import axios from 'axios';

const BASE_URL = '/api/portfolio';

export const fetchDashboardData = async (userId, timeframe = '24h') => {
  try {
    const response = await axios.get(`${BASE_URL}/dashboard/${userId}`, {
      params: { timeframe }
    });
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error('Failed to fetch dashboard data');
  }
};

export const transformDashboardData = (data) => {
  return {
    summary: {
      ...data.summary,
      totalValueFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(data.summary.totalValue),
      profitLossFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        signDisplay: 'always'
      }).format(data.summary.profitLoss)
    },
    holdings: {
      ...data.holdings,
      chartData: data.holdings.distribution.map(holding => ({
        name: holding.symbol,
        value: holding.allocation
      }))
    },
    performance: {
      ...data.performance,
      chartData: [
        {
          name: 'Best',
          symbol: data.performance.bestPerforming.symbol,
          value: data.performance.bestPerforming.performance
        },
        {
          name: 'Worst',
          symbol: data.performance.worstPerforming.symbol,
          value: data.performance.worstPerforming.performance
        }
      ]
    }
  };
};