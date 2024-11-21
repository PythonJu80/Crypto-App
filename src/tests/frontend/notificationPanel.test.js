import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockSocket } from '../mocks/socket';
import NotificationPanel from '../../frontend/components/Notifications/NotificationPanel';

const mockNotifications = [
  {
    id: 1,
    type: 'alert',
    title: 'Price Alert',
    message: 'BTC reached target price of $50,000',
    timestamp: '2024-01-01T12:00:00Z',
    read: false
  },
  {
    id: 2,
    type: 'trade',
    title: 'Trade Executed',
    message: 'Successfully bought 0.1 BTC',
    timestamp: '2024-01-01T11:00:00Z',
    read: false
  },
  {
    id: 3,
    type: 'error',
    title: 'Connection Error',
    message: 'Failed to connect to market data service',
    timestamp: '2024-01-01T10:00:00Z',
    read: true
  }
];

// Mock sessionStorage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockStorage
});

describe('NotificationPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getItem.mockReturnValue(JSON.stringify(mockNotifications));
  });

  it('should render notifications with PepeUSB theme', () => {
    render(<NotificationPanel />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Price Alert')).toBeInTheDocument();
    
    const container = screen.getByRole('heading', { name: /notifications/i })
      .parentElement;
    expect(container).toHaveClass('bg-pepe-dark/90', 'border-pepe-primary');
  });

  it('should handle new notifications via WebSocket', async () => {
    render(<NotificationPanel />);

    const newNotification = {
      type: 'alert',
      title: 'New Alert',
      message: 'ETH price alert triggered'
    };

    mockSocket.emit('notifications', {
      type: 'notification',
      data: newNotification
    });

    await waitFor(() => {
      expect(screen.getByText('New Alert')).toBeInTheDocument();
    });
  });

  it('should filter notifications by type', async () => {
    render(<NotificationPanel />);

    fireEvent.click(screen.getByText('Alerts'));

    expect(screen.getByText('Price Alert')).toBeInTheDocument();
    expect(screen.queryByText('Trade Executed')).not.toBeInTheDocument();
  });

  it('should search notifications', async () => {
    const user = userEvent.setup();
    render(<NotificationPanel />);

    const searchInput = screen.getByPlaceholderText('Search notifications...');
    await user.type(searchInput, 'BTC');

    expect(screen.getByText('Price Alert')).toBeInTheDocument();
    expect(screen.getByText('Successfully bought 0.1 BTC')).toBeInTheDocument();
    expect(screen.queryByText('Connection Error')).not.toBeInTheDocument();
  });

  it('should dismiss individual notifications', async () => {
    render(<NotificationPanel />);

    const dismissButton = screen.getAllByLabelText('Dismiss notification')[0];
    fireEvent.click(dismissButton);

    await waitFor(() => {
      const notification = screen.getByText('Price Alert').closest('div');
      expect(notification).toHaveClass('opacity-50');
    });
  });

  it('should clear all notifications', async () => {
    render(<NotificationPanel />);

    fireEvent.click(screen.getByText('Clear All'));

    await waitFor(() => {
      const notifications = screen.getAllByRole('heading', { level: 3 });
      notifications.forEach(notification => {
        expect(notification.closest('div')).toHaveClass('opacity-50');
      });
    });
  });

  it('should persist notifications in session storage', () => {
    render(<NotificationPanel />);

    expect(mockStorage.getItem).toHaveBeenCalledWith('notifications');
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'notifications',
      expect.any(String)
    );
  });

  it('should show unread count badge', () => {
    render(<NotificationPanel />);

    const badge = screen.getByText('2'); // 2 unread notifications
    expect(badge).toHaveClass('bg-pepe-primary', 'text-pepe-dark');
  });

  it('should apply different styles based on notification type', () => {
    render(<NotificationPanel />);

    const alertNotification = screen.getByText('Price Alert').closest('div');
    const errorNotification = screen.getByText('Connection Error').closest('div');

    expect(alertNotification).toHaveClass('border-pepe-warning');
    expect(errorNotification).toHaveClass('border-pepe-error');
  });
});