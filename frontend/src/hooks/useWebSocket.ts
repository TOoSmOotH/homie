import { useCallback, useMemo } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { NotificationPayload, ServiceStatusUpdate } from '../services/websocket.service';

export const useOptimizedWebSocket = () => {
  const wsContext = useWebSocket();

  // Memoize connection status to prevent unnecessary re-renders
  const connectionStatus = useMemo(() => ({
    status: wsContext.connectionStatus.status,
    isConnected: wsContext.isConnected,
    timestamp: wsContext.connectionStatus.timestamp
  }), [wsContext.connectionStatus.status, wsContext.isConnected, wsContext.connectionStatus.timestamp]);

  // Memoize notifications array
  const notifications = useMemo(() =>
    wsContext.notifications,
    [wsContext.notifications]
  );

  // Memoize service statuses
  const serviceStatuses = useMemo(() =>
    wsContext.serviceStatuses,
    [wsContext.serviceStatuses]
  );

  // Memoize callback functions
  const connect = useCallback(() => {
    wsContext.connect();
  }, [wsContext.connect]);

  const disconnect = useCallback(() => {
    wsContext.disconnect();
  }, [wsContext.disconnect]);

  const subscribeToService = useCallback((serviceType: string) => {
    wsContext.subscribeToService(serviceType);
  }, [wsContext.subscribeToService]);

  const unsubscribeFromService = useCallback((serviceType: string) => {
    wsContext.unsubscribeFromService(serviceType);
  }, [wsContext.unsubscribeFromService]);

  const clearNotifications = useCallback(() => {
    wsContext.clearNotifications();
  }, [wsContext.clearNotifications]);

  const markNotificationRead = useCallback((id: string) => {
    wsContext.markNotificationRead(id);
  }, [wsContext.markNotificationRead]);

  // Create optimized notification helpers
  const unreadNotifications = useMemo(() =>
    notifications.filter(n => !n.read),
    [notifications]
  );

  const getNotificationsByType = useCallback((type: NotificationPayload['type']) =>
    notifications.filter(n => n.type === type),
    [notifications]
  );

  const getServiceStatus = useCallback((serviceType: string) =>
    serviceStatuses[serviceType],
    [serviceStatuses]
  );

  const isServiceOnline = useCallback((serviceType: string) =>
    serviceStatuses[serviceType]?.status === 'online',
    [serviceStatuses]
  );

  return {
    // Connection
    ...connectionStatus,
    connect,
    disconnect,

    // Notifications
    notifications,
    unreadNotifications,
    clearNotifications,
    markNotificationRead,
    getNotificationsByType,

    // Service Status
    serviceStatuses,
    getServiceStatus,
    isServiceOnline,
    subscribeToService,
    unsubscribeFromService
  };
};

export default useOptimizedWebSocket;