import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface ConnectionStatusIndicatorProps {
  className?: string;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  className = ""
}) => {
  const { connectionStatus, isConnected, connect } = useWebSocket();

  const getStatusInfo = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return {
          icon: <Wifi className="w-4 h-4" />,
          text: 'Connected',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Disconnected',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      case 'reconnecting':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          text: 'Reconnecting...',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        };
      case 'error':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Connection Error',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      default:
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Unknown',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          borderColor: 'border-gray-200 dark:border-gray-700'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleReconnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor} ${className}`}
    >
      <span className={statusInfo.color}>
        {statusInfo.icon}
      </span>
      <span className={`text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
      {!isConnected && connectionStatus.status !== 'reconnecting' && (
        <button
          onClick={handleReconnect}
          className="ml-2 text-xs underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-1 rounded"
          style={{ color: statusInfo.color.replace('text-', '') }}
        >
          Reconnect
        </button>
      )}
    </motion.div>
  );
};

export default ConnectionStatusIndicator;