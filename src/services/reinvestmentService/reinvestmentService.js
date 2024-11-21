import { config } from '../../config';
import tradingService from '../tradingService/tradingService';
import marketDataService from '../marketDataService/marketDataService';
import pino from 'pino';
import { metrics } from '../../metrics';

class ReinvestmentService {
  constructor() {
    this.logger = pino({
      transport: {
        target: 'pino-pretty'
      }
    });
    this.pendingReinvestments = new Map();
    this.lastReinvestmentTime = new Map();
  }

  /**
   * Process a successful trade for potential reinvestment
   * @param {Object} trade The completed trade
   * @param {number} profitUSD Profit in USD
   * @returns {Promise<Object>} Reinvestment details
   */
  async processTradeForReinvestment(trade, profitUSD) {
    const transactionId = `reinvest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    try {
      this.logger.info({
        transactionId,
        trade,
        profitUSD
      }, 'Processing trade for reinvestment');

      // Check if profit meets minimum threshold
      if (profitUSD < config.reinvestment.minProfitThreshold) {
        this.logger.info({
          transactionId,
          profitUSD,
          threshold: config.reinvestment.minProfitThreshold
        }, 'Profit below minimum threshold for reinvestment');
        return null;
      }

      // Check timing constraints
      const lastReinvestment = this.lastReinvestmentTime.get(trade.userId);
      if (lastReinvestment && 
          Date.now() - lastReinvestment < config.reinvestment.minTimeBetweenReinvestments) {
        this.logger.info({
          transactionId,
          userId: trade.userId,
          lastReinvestment
        }, 'Too soon for reinvestment');
        return null;
      }

      // Check pending reinvestments limit
      if (this.pendingReinvestments.size >= config.reinvestment.maxPendingReinvestments) {
        this.logger.warn({
          transactionId,
          pendingCount: this.pendingReinvestments.size
        }, 'Maximum pending reinvestments reached');
        return null;
      }

      // Calculate allocations
      const shortTermAmount = profitUSD * config.reinvestment.shortTermAllocation;
      const longTermAmount = profitUSD * config.reinvestment.longTermAllocation;

      // Get potential tokens for reinvestment
      const [shortTermToken, longTermToken] = await Promise.all([
        this.selectTokenForReinvestment(false),
        this.selectTokenForReinvestment(true)
      ]);

      if (!shortTermToken || !longTermToken) {
        this.logger.warn({
          transactionId,
          shortTermToken,
          longTermToken
        }, 'Failed to find suitable tokens for reinvestment');
        return null;
      }

      // Execute reinvestments
      const reinvestments = await Promise.all([
        this.executeReinvestment({
          userId: trade.userId,
          symbol: shortTermToken.symbol,
          amount: shortTermAmount,
          isLongTerm: false,
          transactionId
        }),
        this.executeReinvestment({
          userId: trade.userId,
          symbol: longTermToken.symbol,
          amount: longTermAmount,
          isLongTerm: true,
          transactionId
        })
      ]);

      // Update metrics
      metrics.reinvestmentsExecuted.inc({
        status: 'success',
        type: 'split'
      });
      metrics.reinvestedAmount.observe(profitUSD);

      this.lastReinvestmentTime.set(trade.userId, Date.now());

      this.logger.info({
        transactionId,
        reinvestments
      }, 'Successfully processed reinvestments');

      return {
        shortTerm: reinvestments[0],
        longTerm: reinvestments[1],
        totalAmount: profitUSD
      };

    } catch (error) {
      this.logger.error({
        transactionId,
        error: error.message,
        stack: error.stack
      }, 'Failed to process reinvestment');

      metrics.reinvestmentsExecuted.inc({
        status: 'failure',
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Select a token for reinvestment based on criteria
   * @private
   * @param {boolean} isLongTerm Whether this is for long-term holding
   * @returns {Promise<Object>} Selected token
   */
  async selectTokenForReinvestment(isLongTerm) {
    try {
      // Get market data for top tokens
      const marketData = await marketDataService.getTopTokens(50);
      
      // Apply filters based on configuration
      const filteredTokens = marketData.filter(token => {
        const minVolume = isLongTerm 
          ? config.reinvestment.longTermMinVolume 
          : config.reinvestment.minDailyVolume;
        
        const minMarketCap = isLongTerm
          ? config.reinvestment.longTermMinMarketCap
          : config.reinvestment.minMarketCap;

        return (
          token.volume24h >= minVolume &&
          token.marketCap >= minMarketCap &&
          Math.abs(token.priceChange24h) >= config.reinvestment.minPriceChange24h &&
          Math.abs(token.priceChange24h) <= config.reinvestment.maxPriceChange24h
        );
      });

      if (filteredTokens.length === 0) {
        return null;
      }

      // Sort by momentum score
      const sortedTokens = filteredTokens.sort((a, b) => {
        const scoreA = this.calculateMomentumScore(a, isLongTerm);
        const scoreB = this.calculateMomentumScore(b, isLongTerm);
        return scoreB - scoreA;
      });

      return sortedTokens[0];

    } catch (error) {
      this.logger.error({
        error: error.message,
        isLongTerm
      }, 'Failed to select token for reinvestment');
      throw error;
    }
  }

  /**
   * Calculate momentum score for token selection
   * @private
   * @param {Object} token Token market data
   * @param {boolean} isLongTerm Whether this is for long-term holding
   * @returns {number} Momentum score
   */
  calculateMomentumScore(token, isLongTerm) {
    const volumeWeight = isLongTerm ? 0.3 : 0.4;
    const priceChangeWeight = isLongTerm ? 0.2 : 0.4;
    const marketCapWeight = isLongTerm ? 0.5 : 0.2;

    const volumeScore = Math.min(token.volume24h / config.reinvestment.minDailyVolume, 1);
    const priceChangeScore = Math.abs(token.priceChange24h) / config.reinvestment.maxPriceChange24h;
    const marketCapScore = Math.min(token.marketCap / config.reinvestment.minMarketCap, 1);

    return (
      volumeScore * volumeWeight +
      priceChangeScore * priceChangeWeight +
      marketCapScore * marketCapWeight
    );
  }

  /**
   * Execute a reinvestment trade
   * @private
   * @param {Object} params Reinvestment parameters
   * @returns {Promise<Object>} Trade result
   */
  async executeReinvestment({ userId, symbol, amount, isLongTerm, transactionId }) {
    try {
      const trade = await tradingService.executeTrade({
        userId,
        symbol,
        amount,
        type: 'buy',
        metadata: {
          isReinvestment: true,
          isLongTerm,
          transactionId
        }
      });

      this.pendingReinvestments.set(trade.id, {
        userId,
        amount,
        isLongTerm,
        transactionId,
        timestamp: Date.now()
      });

      return trade;

    } catch (error) {
      this.logger.error({
        transactionId,
        userId,
        symbol,
        amount,
        error: error.message
      }, 'Failed to execute reinvestment trade');
      throw error;
    }
  }

  /**
   * Clean up completed reinvestments
   * @private
   */
  cleanupCompletedReinvestments() {
    const now = Date.now();
    for (const [tradeId, reinvestment] of this.pendingReinvestments.entries()) {
      if (now - reinvestment.timestamp > 24 * 60 * 60 * 1000) { // 24 hours
        this.pendingReinvestments.delete(tradeId);
      }
    }
  }
}

export default new ReinvestmentService();