import { io, Socket } from 'socket.io-client';

// Simple logger for frontend
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args)
};

export interface NotificationPayload {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  serviceType?: string;
  timestamp: Date;
  data?: any;
}

export interface ServiceStatusUpdate {
  serviceType: string;
  status: 'online' | 'offline' | 'error';
  message?: string;
  data?: any;
  timestamp: Date;
}

export interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  timestamp: Date;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private connectionStatus: ConnectionStatus = { status: 'disconnected', timestamp: new Date() };
  private statusCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private notificationCallbacks: ((notification: NotificationPayload) => void)[] = [];
  private serviceStatusCallbacks: ((update: ServiceStatusUpdate) => void)[] = [];
  private systemAlertCallbacks: ((alert: NotificationPayload) => void)[] = [];

  constructor() {
    this.setupSocket();
  }

  private setupSocket() {
    const token = localStorage.getItem('authToken');

    const wsUrl = (import.meta as any).env?.VITE_WS_URL || (typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:9825` : 'ws://localhost:9825');
    this.socket = io(wsUrl, {
      path: '/socket.io',
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: false
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      logger.info('🔌 WebSocket connected:', this.socket?.id);
      this.updateConnectionStatus('connected');
    });

    this.socket.on('disconnect', (reason: any) => {
      logger.info('🔌 WebSocket disconnected:', reason);
      this.updateConnectionStatus('disconnected');
    });

    this.socket.on('connect_error', (error: any) => {
      logger.error('🔌 WebSocket connection error:', error);
      this.updateConnectionStatus('error');
    });

    this.socket.on('reconnect', (attemptNumber: any) => {
      logger.info('🔌 WebSocket reconnected after', attemptNumber, 'attempts');
      this.updateConnectionStatus('connected');
    });

    this.socket.on('reconnecting', (attemptNumber: any) => {
      logger.info('🔌 WebSocket reconnecting, attempt:', attemptNumber);
      this.updateConnectionStatus('reconnecting');
    });

    // Data events
    this.socket.on('notification', (notification: NotificationPayload) => {
      logger.info('📡 Received notification:', notification.title);
      this.notificationCallbacks.forEach(callback => callback(notification));
    });

    this.socket.on('service:status', (update: ServiceStatusUpdate) => {
      logger.info('📡 Received service status update:', update.serviceType, update.status);
      this.serviceStatusCallbacks.forEach(callback => callback(update));
    });

    this.socket.on('system:alert', (alert: NotificationPayload) => {
      logger.warn('🚨 System alert:', alert.title);
      this.systemAlertCallbacks.forEach(callback => callback(alert));
    });

    this.socket.on('connection:status', (status: ConnectionStatus) => {
      logger.info('🔌 Connection status update:', status);
      this.updateConnectionStatus(status.status);
    });
  }

  private updateConnectionStatus(status: ConnectionStatus['status']) {
    this.connectionStatus = { status, timestamp: new Date() };
    this.statusCallbacks.forEach(callback => callback(this.connectionStatus));
  }

  // Connection management
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.setupSocket();
      }

      if (this.socket?.connected) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.socket?.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket?.once('connect_error', (error: any) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.socket?.connect();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.updateConnectionStatus('disconnected');
  }

  // Subscription methods
  subscribeToServiceStatus(serviceType: string) {
    this.socket?.emit('subscribe:service-status', serviceType);
  }

  unsubscribeFromServiceStatus(serviceType: string) {
    this.socket?.emit('unsubscribe:service-status', serviceType);
  }

  // Callback registration
  onConnectionStatus(callback: (status: ConnectionStatus) => void) {
    this.statusCallbacks.push(callback);
    // Immediately call with current status
    callback(this.connectionStatus);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  onNotification(callback: (notification: NotificationPayload) => void) {
    this.notificationCallbacks.push(callback);
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  onServiceStatus(callback: (update: ServiceStatusUpdate) => void) {
    this.serviceStatusCallbacks.push(callback);
    return () => {
      const index = this.serviceStatusCallbacks.indexOf(callback);
      if (index > -1) {
        this.serviceStatusCallbacks.splice(index, 1);
      }
    };
  }

  onSystemAlert(callback: (alert: NotificationPayload) => void) {
    this.systemAlertCallbacks.push(callback);
    return () => {
      const index = this.systemAlertCallbacks.indexOf(callback);
      if (index > -1) {
        this.systemAlertCallbacks.splice(index, 1);
      }
    };
  }

  // Getters
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus.status === 'connected';
  }

  // Cleanup
  destroy() {
    this.disconnect();
    this.statusCallbacks = [];
    this.notificationCallbacks = [];
    this.serviceStatusCallbacks = [];
    this.systemAlertCallbacks = [];
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
