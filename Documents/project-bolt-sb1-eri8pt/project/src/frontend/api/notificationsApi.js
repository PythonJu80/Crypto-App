import axios from 'axios';

const BASE_URL = '/api/notifications';

export const fetchNotifications = async (userId, options = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/${userId}`, { params: options });
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error('Failed to fetch notifications');
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const response = await axios.patch(`${BASE_URL}/${notificationId}/read`);
    return response.data.success;
  } catch (error) {
    throw new Error('Failed to mark notification as read');
  }
};

export const clearNotifications = async (userId) => {
  try {
    const response = await axios.post(`${BASE_URL}/clear`, { userId });
    return response.data.success;
  } catch (error) {
    throw new Error('Failed to clear notifications');
  }
};

export const transformNotification = (notification) => {
  const baseNotification = {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    timestamp: notification.timestamp,
    read: notification.read,
    type: notification.type
  };

  switch (notification.type) {
    case 'trade':
      return {
        ...baseNotification,
        trade: notification.data,
        icon: '💱',
        color: 'pepe-primary'
      };
    case 'alert':
      return {
        ...baseNotification,
        alert: notification.data,
        icon: '🔔',
        color: 'pepe-warning'
      };
    case 'error':
      return {
        ...baseNotification,
        error: notification.data,
        icon: '⚠️',
        color: 'pepe-error'
      };
    default:
      return {
        ...baseNotification,
        icon: 'ℹ️',
        color: 'pepe-primary'
      };
  }
};