import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  markAllAsRead: () => {},
  markAsRead: (id) => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef(null);

  const debouncedInvalidate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitor-details'] });
      queryClient.invalidateQueries({ queryKey: ['funnel'] });
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['executive-summary'] });
      queryClient.invalidateQueries({ queryKey: ['audience-growth'] });
      queryClient.invalidateQueries({ queryKey: ['conversion-rates'] });
      queryClient.invalidateQueries({ queryKey: ['journey-summary'] });
      queryClient.invalidateQueries({ queryKey: ['audience-overview'] });
      queryClient.invalidateQueries({ queryKey: ['entry-rate'] });
    }, 1000);
  }, [queryClient]);

  useEffect(() => {
    if (isAuthenticated) {
      const socket = connectSocket();
      
      const handleNotification = (data) => {
        const notif = { ...data, id: Date.now().toString(), read: false };
        setNotifications(prev => [notif, ...prev]);
        debouncedInvalidate();
      };

      const handleEventTracked = () => {
        debouncedInvalidate();
      };

      const handleVisitorIdentified = () => {
        debouncedInvalidate();
      };

      socket.on('notification', handleNotification);
      socket.on('event:tracked', handleEventTracked);
      socket.on('visitor:identified', handleVisitorIdentified);

      return () => {
        socket.off('notification', handleNotification);
        socket.off('event:tracked', handleEventTracked);
        socket.off('visitor:identified', handleVisitorIdentified);
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        disconnectSocket();
      };
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, debouncedInvalidate]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
