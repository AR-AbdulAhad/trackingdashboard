import { createContext, useContext, useState, useEffect } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';

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

  useEffect(() => {
    if (isAuthenticated) {
      const socket = connectSocket();
      
      const handleNotification = (data) => {
        const notif = { ...data, id: Date.now().toString(), read: false };
        setNotifications(prev => [notif, ...prev]);
      };

      socket.on('notification', handleNotification);

      return () => {
        socket.off('notification', handleNotification);
        disconnectSocket();
      };
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);

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
