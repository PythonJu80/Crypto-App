import { fetchSettings, updateSettings, getReinvestmentHistory } from '../../frontend/api/reinvestmentApi';
import axios from 'axios';

jest.mock('axios');

describe('Reinvestment API', () => {
  const userId = 1;
  const mockSettings = {
    isAutomated: true,
    profitThreshold: 5,
    shortTermAllocation: 70,
    longTermAllocation: 30
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchSettings', () => {
    it('should fetch user settings successfully', async () => {
      axios.get.mockResolvedValue({
        data: { success: true, data: mockSettings }
      });

      const result = await fetchSettings(userId);
      expect(result).toEqual(mockSettings);
      expect(axios.get).toHaveBeenCalledWith(`/api/reinvestment/settings/${userId}`);
    });

    it('should handle fetch errors', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(fetchSettings(userId)).rejects.toThrow('Failed to fetch reinvestment settings');
    });
  });

  describe('updateSettings', () => {
    it('should update settings successfully', async () => {
      axios.put.mockResolvedValue({
        data: { success: true }
      });

      const result = await updateSettings(userId, mockSettings);
      expect(result).toBe(true);
      expect(axios.put).toHaveBeenCalledWith(
        `/api/reinvestment/settings/${userId}`,
        mockSettings
      );
    });

    it('should handle update errors', async () => {
      axios.put.mockRejectedValue(new Error('Network error'));

      await expect(updateSettings(userId, mockSettings)).rejects.toThrow(
        'Failed to update reinvestment settings'
      );
    });
  });

  describe('getReinvestmentHistory', () => {
    const mockHistory = [
      {
        id: 1,
        timestamp: '2024-01-01T12:00:00Z',
        amount: 1000,
        shortTermTrade: { symbol: 'BTC', amount: 700 },
        longTermTrade: { symbol: 'ETH', amount: 300 }
      }
    ];

    it('should fetch history successfully', async () => {
      axios.get.mockResolvedValue({
        data: { success: true, data: mockHistory }
      });

      const result = await getReinvestmentHistory(userId);
      expect(result).toEqual(mockHistory);
      expect(axios.get).toHaveBeenCalledWith(
        `/api/reinvestment/history/${userId}`,
        { params: {} }
      );
    });

    it('should handle history fetch errors', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(getReinvestmentHistory(userId)).rejects.toThrow(
        'Failed to fetch reinvestment history'
      );
    });

    it('should pass query options', async () => {
      const options = { limit: 10, offset: 0 };
      axios.get.mockResolvedValue({
        data: { success: true, data: mockHistory }
      });

      await getReinvestmentHistory(userId, options);
      expect(axios.get).toHaveBeenCalledWith(
        `/api/reinvestment/history/${userId}`,
        { params: options }
      );
    });
  });
});