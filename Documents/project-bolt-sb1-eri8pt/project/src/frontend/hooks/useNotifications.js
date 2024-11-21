import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { fetchNotifications, markAsRead, clearNotifications } from '../api/notificationsApi';

const MAX_NOTIFICATIONS = 100;
const STORAGE_KEY = 'notifications';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    read: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          setNotifications(JSON.parse(stored));
        }
        if (userId) {
          const serverNotifications = await fetchNotifications(userId);
          setNotifications(prev => {
            const combined = [...serverNotifications, ...prev];
            const unique = Array.from(
              new Map(combined.map(n => [n.id, n])).values()
            ).slice(0, MAX_NOTIFICATIONS);
            return unique;
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [userId]);

  // WebSocket connection for real-time updates
  const socket = useWebSocket('notifications', (update) => {
    if (update.type === 'notification') {
      setNotifications(prev => {
        const newNotifications = [{
          id: Date.now(),
          timestamp: new Date().toISOString(),
          read: false,
          ...update.data
        }, ...prev].slice(0, MAX_NOTIFICATIONS);

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifications));
        return newNotifications;
      });
    }
  });

  // Handle connection status
  useEffect(() => {
    if (socket) {
      const handleDisconnect = () => {
        setNotifications(prev => [{
          id: Date.now(),
          type: 'error',
          title: 'Connection Lost',
          message: 'WebSocket connection lost. Attempting to reconnect...',
          timestamp: new Date().toISOString(),
          read: false
        }, ...prev]);
      };

      const handleReconnect = () => {
        setNotifications(prev => [{
          id: Date.now(),
          type: 'system',
          title: 'Connection Restored',
          message: 'WebSocket connection restored',
          timestamp: new Date().toISOString(),
          read: false
        }, ...prev]);
      };

      socket.on('disconnect', handleDisconnect);
      socket.on('connect', handleReconnect);

      return () => {
        socket.off('disconnect', handleDisconnect);
        socket.off('connect', handleReconnect);
      };
    }
  }, [socket]);

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filters.type !== 'all' && n.type !== filters.type) return false;
    if (filters.read !== 'all' && n.read !== (filters.read === 'read')) return false;
    return true;
  });

  // Mark notification as read
  const dismissNotification = useCallback(async (id) => {
    try {
      if (userId) {
        await markAsRead(id);
      }
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (err) {
      setError(err.message);
    }
  }, [userId, notifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      if (userId) {
        await clearNotifications(userId);
      }
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (err) {
      setError(err.message);
    }
  }, [userId, notifications]);

  return {
    notifications: filteredNotifications,
    filters,
    setFilters,
    dismissNotification,
    clearAll,
    unreadCount: notifications.filter(n => !n.read).length,
    isLoading,
    error
  };
};