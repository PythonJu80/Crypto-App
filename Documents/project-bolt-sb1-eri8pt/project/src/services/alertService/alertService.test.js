const alertService = require('./alertService');
const marketDataService = require('../marketDataService/marketDataService');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

jest.mock('../marketDataService/marketDataService');

describe('AlertService', () => {
  const testDb = path.join(__dirname, '../../database/trades.db');
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('createAlert', () => {
    const validAlertData = {
      userId: 1,
      symbol: 'BTC',
      targetPrice: 50000,
      condition: 'above'
    };

    it('should create a valid alert', async () => {
      const alert = await alertService.createAlert(validAlertData);
      
      expect(alert).toMatchObject({
        userId: validAlertData.userId,
        symbol: validAlertData.symbol,
        targetPrice: validAlertData.targetPrice,
        condition: validAlertData.condition,
        isActive: true,
        isTriggered: false
      });
    });

    it('should reject invalid cryptocurrency', async () => {
      const invalidData = { ...validAlertData, symbol: 'INVALID' };
      
      await expect(alertService.createAlert(invalidData))
        .rejects
        .toThrow('Invalid cryptocurrency');
    });

    it('should reject invalid condition', async () => {
      const invalidData = { ...validAlertData, condition: 'invalid' };
      
      await expect(alertService.createAlert(invalidData))
        .rejects
        .toThrow('Invalid condition');
    });
  });

  describe('getActiveAlerts', () => {
    const userId = 1;

    it('should return active alerts for user', async () => {
      const alerts = await alertService.getActiveAlerts(userId);
      
      expect(Array.isArray(alerts)).toBe(true);
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('symbol');
        expect(alert).toHaveProperty('targetPrice');
        expect(alert).toHaveProperty('condition');
        expect(alert.isActive).toBe(true);
      });
    });
  });

  describe('updateAlertStatus', () => {
    it('should update alert status', async () => {
      const alertId = 1;
      const result = await alertService.updateAlertStatus(alertId, false);
      
      expect(result).toEqual({
        id: alertId,
        isActive: false
      });
    });

    it('should handle non-existent alert', async () => {
      const invalidAlertId = 999999;
      
      await expect(alertService.updateAlertStatus(invalidAlertId, false))
        .rejects
        .toThrow('Alert not found');
    });
  });

  describe('deleteAlert', () => {
    it('should delete existing alert', async () => {
      const alertId = 1;
      const userId = 1;
      
      const result = await alertService.deleteAlert(alertId, userId);
      expect(result).toBe(true);
    });

    it('should return false for non-existent alert', async () => {
      const invalidAlertId = 999999;
      const userId = 1;
      
      const result = await alertService.deleteAlert(invalidAlertId, userId);
      expect(result).toBe(false);
    });
  });

  describe('alert monitoring', () => {
    const userId = 1;
    const mockPrices = {
      bitcoin: { usd: 52000 },
      ethereum: { usd: 3200 }
    };

    beforeEach(() => {
      marketDataService.getCurrentPrices.mockResolvedValue(mockPrices);
      marketDataService.symbolToId.mockImplementation(symbol => 
        symbol === 'BTC' ? 'bitcoin' : 'ethereum'
      );
    });

    it('should start and stop monitoring', () => {
      alertService.startMonitoring(userId);
      expect(alertService.activeChecks.has(userId)).toBe(true);
      
      alertService.stopMonitoring(userId);
      expect(alertService.activeChecks.has(userId)).toBe(false);
    });

    it('should not create duplicate monitoring', () => {
      alertService.startMonitoring(userId);
      const firstInterval = alertService.activeChecks.get(userId);
      
      alertService.startMonitoring(userId);
      const secondInterval = alertService.activeChecks.get(userId);
      
      expect(firstInterval).toBe(secondInterval);
      
      alertService.stopMonitoring(userId);
    });
  });
});