export const config = {
  // Trading configuration
  trading: {
    minTradeAmount: 0.0001,
    maxTradeAmount: 10,
    defaultFeeRate: 0.001
  },

  // Reinvestment configuration
  reinvestment: {
    // Minimum profit required to trigger reinvestment (in USD)
    minProfitThreshold: 50,
    
    // Allocation percentages
    shortTermAllocation: 0.7,  // 70% for short-term trades
    longTermAllocation: 0.3,   // 30% for long-term holds
    
    // Token selection criteria
    minDailyVolume: 1000000,   // Minimum 24h volume in USD
    minMarketCap: 10000000,    // Minimum market cap in USD
    
    // Momentum indicators
    minPriceChange24h: 2,      // Minimum 24h price change percentage
    maxPriceChange24h: 20,     // Maximum 24h price change percentage
    
    // Timing constraints
    minTimeBetweenReinvestments: 3600000, // 1 hour in milliseconds
    maxPendingReinvestments: 5,           // Maximum number of pending reinvestments
    
    // Long-term hold criteria
    longTermMinMarketCap: 50000000,       // Higher market cap for long-term holds
    longTermMinVolume: 5000000            // Higher volume requirement for long-term
  }
};