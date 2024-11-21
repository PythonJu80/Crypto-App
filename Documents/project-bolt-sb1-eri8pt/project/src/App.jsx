import React from 'react';
import PortfolioDashboard from './frontend/components/PortfolioDashboard';

const App = () => {
  // In a real app, this would come from auth context
  const userId = 1;

  return (
    <div className="min-h-screen bg-binance-black">
      <PortfolioDashboard userId={userId} />
    </div>
  );
};

export default App;