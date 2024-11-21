import axios from 'axios';

const BASE_URL = '/api/reinvestment';

export const fetchSettings = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/settings/${userId}`);
    return response.data.data;
  } catch (error) {
    throw new Error('Failed to fetch reinvestment settings');
  }
};

export const updateSettings = async (userId, settings) => {
  try {
    const response = await axios.put(`${BASE_URL}/settings/${userId}`, settings);
    return response.data.success;
  } catch (error) {
    throw new Error('Failed to update reinvestment settings');
  }
};

export const getReinvestmentHistory = async (userId, options = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/history/${userId}`, { params: options });
    return response.data.data;
  } catch (error) {
    throw new Error('Failed to fetch reinvestment history');
  }
};