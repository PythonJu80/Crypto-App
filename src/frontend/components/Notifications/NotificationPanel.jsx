import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationCard = ({ notification, onDismiss }) => {
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'alert':
        return 'border-pepe-warning text-pepe-warning';
      case 'error':
        return 'border-pepe-error text-pepe-error';
      default:
        return 'border-pepe-primary text-pepe-primary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`bg-pepe-dark/90 rounded-lg p-4 border-2 ${getTypeStyles()}
                  ${notification.read ? 'opacity-50' : 'animate-usb-pulse'}
                  hover:shadow-pepe-hover transition-all duration-300`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-['Press_Start_2P'] text-sm mb-2">
            {notification.title}
          </h3>
          <p className="text-pepe-light text-sm">
            {notification.message}
          </p>
          <span className="text-pepe-light/50 text-xs mt-2 block">
            {new Date(notification.timestamp).toLocaleString()}
          </span>
        </div>
        {!notification.read && (
          <button
            onClick={() => onDismiss(notification.id)}
            className="ml-4 text-pepe-light hover:text-pepe-primary transition-colors"
            aria-label="Dismiss notification"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
};

const FilterButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full font-['Press_Start_2P'] text-xs
                transition-all duration-300 ${
      active
        ? 'bg-pepe-primary text-pepe-dark'
        : 'bg-pepe-dark/50 text-pepe-primary hover:bg-pepe-dark/70'
    }`}
  >
    {label}
  </button>
);

const NotificationPanel = () => {
  const {
    notifications,
    filters,
    setFilters,
    dismissNotification,
    clearAll,
    unreadCount
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-pepe-dark/90 rounded-lg border-2 border-pepe-primary p-6
                    shadow-pepe hover:shadow-pepe-hover transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-['Press_Start_2P'] text-pepe-primary flex items-center">
          <span className="w-3 h-3 rounded-full bg-pepe-primary animate-usb-pulse mr-3" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-3 px-2 py-1 text-xs bg-pepe-primary text-pepe-dark rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={clearAll}
            className="text-pepe-light hover:text-pepe-primary transition-colors text-sm"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-pepe-dark/50 border-2 border-pepe-primary rounded-lg px-4 py-2
                     text-pepe-light placeholder-pepe-light/50 focus:outline-none focus:ring-2
                     focus:ring-pepe-primary transition-all duration-300"
        />
      </div>

      <div className="flex space-x-4 mb-6 overflow-x-auto pb-2
                      scrollbar-thin scrollbar-thumb-pepe-primary scrollbar-track-pepe-dark">
        <FilterButton
          label="All Types"
          active={filters.type === 'all'}
          onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}
        />
        <FilterButton
          label="Alerts"
          active={filters.type === 'alert'}
          onClick={() => setFilters(prev => ({ ...prev, type: 'alert' }))}
        />
        <FilterButton
          label="Trades"
          active={filters.type === 'trade'}
          onClick={() => setFilters(prev => ({ ...prev, type: 'trade' }))}
        />
        <FilterButton
          label="Errors"
          active={filters.type === 'error'}
          onClick={() => setFilters(prev => ({ ...prev, type: 'error' }))}
        />
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto
                      scrollbar-thin scrollbar-thumb-pepe-primary scrollbar-track-pepe-dark">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onDismiss={dismissNotification}
            />
          ))}
        </AnimatePresence>

        {filteredNotifications.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <p className="text-pepe-light text-sm animate-usb-pulse">
              No notifications found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;