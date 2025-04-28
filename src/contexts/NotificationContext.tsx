
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Notification, NotificationType } from '@/types';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Add a new notification
  const addNotification = (type: NotificationType, message: string) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      userId: 'current-user', // In a real app, this would be the current user's ID
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message,
      type,
      read: false,
      createdAt: new Date(),
      timestamp: new Date() // For backward compatibility
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };
  
  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        // Convert string dates back to Date objects
        const formatted = parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          timestamp: new Date(n.createdAt) // For backward compatibility
        }));
        setNotifications(formatted);
      } catch (e) {
        console.error('Error loading notifications from localStorage', e);
      }
    }
  }, []);
  
  // Save notifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      addNotification, 
      markAsRead,
      markAllAsRead, 
      clearAll, 
      unreadCount 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
