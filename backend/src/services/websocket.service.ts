import { Server as SocketServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { ServiceType } from '../models/ServiceConfig';

export interface NotificationPayload {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  serviceType?: ServiceType;
  timestamp: Date;
  data?: any;
}

export interface ServiceStatusUpdate {
  serviceType: ServiceType;
  status: 'online' | 'offline' | 'error';
  message?: string;
  data?: any;
  timestamp: Date;
}

export class WebSocketService {
  private io: SocketServer;

  constructor(io: SocketServer) {
    this.io = io;
  }

  // Broadcast service status update to all clients subscribed to that service
  broadcastServiceStatus(update: ServiceStatusUpdate) {
    try {
      const room = `service_${update.serviceType}`;
      this.io.to(room).emit('service:status', update);
      logger.info(`📡 Broadcasted service status update for ${update.serviceType}: ${update.status}`);
    } catch (error) {
      logger.error('Error broadcasting service status:', error);
    }
  }

  // Send notification to specific user
  sendNotificationToUser(userId: string, notification: NotificationPayload) {
    try {
      const room = `user_${userId}`;
      this.io.to(room).emit('notification', notification);
      logger.info(`📡 Sent notification to user ${userId}: ${notification.title}`);
    } catch (error) {
      logger.error('Error sending notification to user:', error);
    }
  }

  // Broadcast notification to all connected clients
  broadcastNotification(notification: NotificationPayload) {
    try {
      this.io.emit('notification', notification);
      logger.info(`📡 Broadcasted notification: ${notification.title}`);
    } catch (error) {
      logger.error('Error broadcasting notification:', error);
    }
  }

  // Send system alert to all connected clients
  sendSystemAlert(alert: Omit<NotificationPayload, 'id' | 'timestamp'>) {
    try {
      const notification: NotificationPayload = {
        ...alert,
        id: `system_${Date.now()}`,
        timestamp: new Date()
      };

      this.io.emit('system:alert', notification);
      logger.info(`🚨 System alert: ${notification.title}`);
    } catch (error) {
      logger.error('Error sending system alert:', error);
    }
  }

  // Send service status to specific client
  sendServiceStatusToClient(socket: Socket, update: ServiceStatusUpdate) {
    try {
      socket.emit('service:status', update);
      logger.info(`📡 Sent service status to client ${socket.id}: ${update.serviceType} - ${update.status}`);
    } catch (error) {
      logger.error('Error sending service status to client:', error);
    }
  }

  // Send connection status to client
  sendConnectionStatus(socket: Socket, status: 'connected' | 'disconnected' | 'reconnecting') {
    try {
      socket.emit('connection:status', { status, timestamp: new Date() });
      logger.info(`🔌 Connection status sent to client ${socket.id}: ${status}`);
    } catch (error) {
      logger.error('Error sending connection status:', error);
    }
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.io.sockets.sockets.size;
  }

  // Get clients in specific room
  getClientsInRoom(room: string): string[] {
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    return roomSockets ? Array.from(roomSockets) : [];
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    const userRoom = `user_${userId}`;
    const roomSockets = this.io.sockets.adapter.rooms.get(userRoom);
    return roomSockets ? roomSockets.size > 0 : false;
  }

  // Create notification helper methods
  createServiceNotification(
    serviceType: ServiceType,
    status: 'online' | 'offline' | 'error',
    message?: string,
    data?: any
  ): NotificationPayload {
    const statusMessages = {
      online: `${serviceType} is now online`,
      offline: `${serviceType} is now offline`,
      error: `${serviceType} encountered an error`
    };

    return {
      id: `service_${serviceType}_${Date.now()}`,
      type: status === 'online' ? 'success' : status === 'error' ? 'error' : 'warning',
      title: `${serviceType} Status Update`,
      message: message || statusMessages[status],
      serviceType,
      timestamp: new Date(),
      data
    };
  }

  createSystemNotification(
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: any
  ): NotificationPayload {
    return {
      id: `system_${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      data
    };
  }
}

export default WebSocketService;