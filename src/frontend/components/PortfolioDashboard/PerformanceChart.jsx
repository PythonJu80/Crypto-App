import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-pepe-dark/90 shadow-pepe rounded-lg p-4 border-2 border-pepe-primary">
      <p className="font-['Press_Start_2P'] text-pepe-primary">{data.symbol}</p>
      <p className="text-pepe-light">
        Performance: {data.value.toFixed(2)}%
      </p>
      <p className="text-pepe-light">
        Profit/Loss: {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          signDisplay: 'always'
        }).format(data.profitLoss)}
      </p>
    </div>
  );
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      payload: PropTypes.shape({
        symbol: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        profitLoss: PropTypes.number.isRequired,
      }),
    })
  ),
};

const PerformanceChart = ({ data }) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  return (
    <div className="p-6">
      <h2 className="text-xl font-['Press_Start_2P'] mb-6 text-pepe-primary">
        Performance Overview
      </h2>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#006400"
              vertical={false}
            />
            <XAxis 
              dataKey="symbol"
              tick={{ fill: '#98FF98', fontFamily: 'Press Start 2P' }}
            />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: '#98FF98', fontFamily: 'Press Start 2P' }}
              axisLine={{ stroke: '#006400' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              name="Performance"
              onMouseEnter={(_, index) => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {data.chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value >= 0 ? '#00FF00' : '#FF4500'}
                  opacity={hoveredBar === index ? 0.8 : 1}
                  className="transition-opacity duration-200"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="bg-pepe-dark/90 rounded-lg p-4 border-2 border-pepe-primary animate-usb-pulse">
          <p className="text-pepe-light text-sm">Trade Count</p>
          <p className="text-xl font-['Press_Start_2P'] text-pepe-primary mt-1">
            {data.tradeCount}
          </p>
        </div>
        <div className="bg-pepe-dark/90 rounded-lg p-4 border-2 border-pepe-primary animate-usb-pulse">
          <p className="text-pepe-light text-sm">Volume</p>
          <p className="text-xl font-['Press_Start_2P'] text-pepe-primary mt-1">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact'
            }).format(data.volume)}
          </p>
        </div>
      </div>
    </div>
  );
};

PerformanceChart.propTypes = {
  data: PropTypes.shape({
    chartData: PropTypes.arrayOf(
      PropTypes.shape({
        symbol: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        profitLoss: PropTypes.number.isRequired,
      })
    ).isRequired,
    tradeCount: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired,
  }).isRequired,
};

export default PerformanceChart;