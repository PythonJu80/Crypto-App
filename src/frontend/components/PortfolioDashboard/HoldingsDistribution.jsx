import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#00FF00', '#98FF98', '#32CD32', '#006400', '#90EE90'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-pepe-dark/90 shadow-pepe rounded-lg p-4 border-2 border-pepe-primary">
      <p className="font-['Press_Start_2P'] text-pepe-primary">{data.name}</p>
      <p className="text-pepe-light">
        Allocation: {data.value.toFixed(2)}%
      </p>
      <p className="text-pepe-light">
        Value: {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(data.rawValue)}
      </p>
    </div>
  );
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      payload: PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        rawValue: PropTypes.number.isRequired,
      }),
    })
  ),
};

const HoldingsDistribution = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className="p-6">
      <h2 className="text-xl font-['Press_Start_2P'] mb-6 text-pepe-primary">
        Holdings Distribution
      </h2>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  opacity={activeIndex === index ? 0.8 : 1}
                  className="transition-opacity duration-200"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-['Press_Start_2P'] mb-4 text-pepe-primary">
          Top Holdings
        </h3>
        <div className="space-y-3">
          {data.top.map((holding, index) => (
            <div 
              key={holding.symbol}
              className="flex items-center justify-between p-3 rounded-lg bg-pepe-dark/90 border-2 border-pepe-primary hover:bg-pepe-dark/70 transition-colors duration-200 animate-usb-pulse"
            >
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-['Press_Start_2P'] text-pepe-primary">
                  {holding.symbol}
                </span>
              </div>
              <div className="text-right">
                <span className="font-['Press_Start_2P'] text-pepe-primary">
                  {holding.allocation.toFixed(2)}%
                </span>
                <p className="text-sm text-pepe-light">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(holding.value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

HoldingsDistribution.propTypes = {
  data: PropTypes.shape({
    chartData: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        rawValue: PropTypes.number.isRequired,
      })
    ).isRequired,
    top: PropTypes.arrayOf(
      PropTypes.shape({
        symbol: PropTypes.string.isRequired,
        allocation: PropTypes.number.isRequired,
        value: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
};

export default HoldingsDistribution;