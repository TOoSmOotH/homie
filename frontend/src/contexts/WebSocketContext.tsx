import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import websocketService, {
  ConnectionStatus,
  NotificationPayload,
  ServiceStatusUpdate
} from '../services/websocket.service';

interface WebSocketContextType {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  notifications: NotificationPayload[];
  serviceStatuses: Record<string, ServiceStatusUpdate>;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeToService: (serviceType: string) => void;
  unsubscribeFromService: (serviceType: string) => void;
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    websocketService.getConnectionStatus()
  );
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [serviceStatuses, setServiceStatuses] = useState<Record<string, ServiceStatusUpdate>>({});

  useEffect(() => {
    // Set up event listeners
    const unsubscribeConnectionStatus = websocketService.onConnectionStatus((status) => {
      setConnectionStatus(status);
    });

    const unsubscribeNotifications = websocketService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    const unsubscribeServiceStatus = websocketService.onServiceStatus((update) => {
      setServiceStatuses(prev => ({
        ...prev,
        [update.serviceType]: update
      }));
    });

    const unsubscribeSystemAlerts = websocketService.onSystemAlert((alert) => {
      setNotifications(prev => [alert, ...prev]);
    });

    // Cleanup function
    return () => {
      unsubscribeConnectionStatus();
      unsubscribeNotifications();
      unsubscribeServiceStatus();
      unsubscribeSystemAlerts();
    };
  }, []);

  const connect = async () => {
    try {
      await websocketService.connect();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      throw error;
    }
  };

  const disconnect = () => {
    websocketService.disconnect();
  };

  const subscribeToService = (serviceType: string) => {
    websocketService.subscribeToServiceStatus(serviceType);
  };

  const unsubscribeFromService = (serviceType: string) => {
    websocketService.unsubscribeFromServiceStatus(serviceType);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const value: WebSocketContextType = {
    connectionStatus,
    isConnected: connectionStatus.status === 'connected',
    notifications,
    serviceStatuses,
    connect,
    disconnect,
    subscribeToService,
    unsubscribeFromService,
    clearNotifications,
    markNotificationRead
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;