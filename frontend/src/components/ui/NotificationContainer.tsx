import React from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { NotificationToast } from './NotificationToast';

export const NotificationContainer: React.FC = () => {
  const { notifications, markNotificationRead } = useWebSocket();

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={markNotificationRead}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;