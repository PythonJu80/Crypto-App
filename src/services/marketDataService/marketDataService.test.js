const marketDataService = require('./marketDataService');

describe('MarketDataService', () => {
  beforeEach(() => {
    marketDataService.clearCache();
  });

  describe('getCurrentPrices', () => {
    it('should fetch current prices for specified cryptocurrencies', async () => {
      // TODO: Implement test
    });

    it('should use cached data when available', async () => {
      // TODO: Implement test
    });

    it('should handle API errors gracefully', async () => {
      // TODO: Implement test
    });
  });

  describe('getHistoricalData', () => {
    it('should fetch OHLC data for specified cryptocurrency', async () => {
      // TODO: Implement test
    });

    it('should use cached data when available', async () => {
      // TODO: Implement test
    });

    it('should handle API errors gracefully', async () => {
      // TODO: Implement test
    });
  });

  describe('symbolToId', () => {
    it('should convert known symbols to CoinGecko IDs', () => {
      // TODO: Implement test
    });

    it('should handle unknown symbols', () => {
      // TODO: Implement test
    });
  });
});