import { Request, Response, NextFunction } from 'express';
import { dbConnection } from '../database/connection';
import { Service, ServiceStatus } from '../models/Service';
import { logger } from '../utils/logger';
import * as os from 'os';

export class DashboardController {
  // Main dashboard endpoint that returns all aggregated data
  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);

      // Get service counts
      const [totalServices, services] = await Promise.all([
        serviceRepository.count(),
        serviceRepository.find()
      ]);

      const activeServices = services.filter((s: Service) => s.status === ServiceStatus.ONLINE).length;
      const inactiveServices = services.filter((s: Service) => s.status === ServiceStatus.OFFLINE).length;

      // Calculate system health based on service status
      const systemHealth = totalServices > 0 
        ? Math.round((activeServices / totalServices) * 100)
        : 100;

      // Get system metrics
      const systemMetrics = {
        cpu: Math.round((1 - os.loadavg()[0] / os.cpus().length) * 100),
        memory: Math.round((1 - os.freemem() / os.totalmem()) * 100),
        disk: 45, // Placeholder - would need disk usage library
        network: 20 // Placeholder - would need network monitoring
      };

      // Generate recent activity
      const recentActivity = services.slice(0, 5).map((service: Service, index: number) => ({
        id: index + 1,
        message: `Service ${service.name} was ${service.status === ServiceStatus.ONLINE ? 'checked and is online' : 'checked and is offline'}`,
        time: service.lastChecked ? new Date(service.lastChecked).toLocaleTimeString() : 'Never',
        type: service.status === ServiceStatus.ONLINE ? 'success' as const : 
              service.status === ServiceStatus.OFFLINE ? 'error' as const : 
              'info' as const
      }));

      res.json({
        success: true,
        data: {
          totalServices,
          activeServices,
          inactiveServices,
          systemHealth,
          systemMetrics,
          recentActivity
        }
      });
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);

      const [totalServices, services] = await Promise.all([
        serviceRepository.count(),
        serviceRepository.find()
      ]);

      const activeServices = services.filter((s: Service) => s.status === ServiceStatus.ONLINE).length;
      const inactiveServices = services.filter((s: Service) => s.status === ServiceStatus.OFFLINE).length;

      res.json({
        success: true,
        data: {
          totalServices,
          activeServices,
          inactiveServices,
          percentageOnline: totalServices > 0 ? Math.round((activeServices / totalServices) * 100) : 0
        }
      });
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      next(error);
    }
  };

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);

      const services: Service[] = await serviceRepository.find({
        order: { updatedAt: 'DESC' },
        take: 10
      });

      const summary = {
        totalServices: await serviceRepository.count(),
        servicesOnline: services.filter((s: Service) => s.status === ServiceStatus.ONLINE).length,
        servicesOffline: services.filter((s: Service) => s.status === ServiceStatus.OFFLINE).length,
        lastUpdated: services[0]?.updatedAt || new Date(),
        recentlyUpdated: services.map(s => ({
          id: s.id,
          name: s.name,
          status: s.status,
          lastChecked: s.lastChecked
        }))
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error getting dashboard summary:', error);
      next(error);
    }
  };

  getMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // System metrics
      const cpuUsage = Math.round((1 - os.loadavg()[0] / os.cpus().length) * 100);
      const memoryUsage = Math.round((1 - os.freemem() / os.totalmem()) * 100);
      const uptime = os.uptime();

      const metrics = {
        cpu: {
          usage: cpuUsage,
          cores: os.cpus().length,
          loadAverage: os.loadavg()
        },
        memory: {
          usage: memoryUsage,
          total: Math.round(os.totalmem() / (1024 * 1024 * 1024)), // GB
          free: Math.round(os.freemem() / (1024 * 1024 * 1024)), // GB
          used: Math.round((os.totalmem() - os.freemem()) / (1024 * 1024 * 1024)) // GB
        },
        system: {
          uptime: uptime,
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname()
        }
      };

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error getting system metrics:', error);
      next(error);
    }
  };

  getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);

      const offlineServices: Service[] = await serviceRepository.find({
        where: { status: ServiceStatus.OFFLINE }
      });

      const alerts = offlineServices.map((service: Service) => ({
        id: service.id,
        type: 'service_offline',
        severity: 'warning',
        title: `Service Offline: ${service.name}`,
        message: `The service ${service.name} is currently offline`,
        timestamp: service.lastChecked || service.updatedAt,
        service: {
          id: service.id,
          name: service.name,
          type: 'service'
        }
      }));

      // Add system alerts if needed
      const memoryUsage = Math.round((1 - os.freemem() / os.totalmem()) * 100);
      if (memoryUsage > 90) {
        alerts.push({
          id: 'mem-alert',
          type: 'system',
          severity: 'critical',
          title: 'High Memory Usage',
          message: `Memory usage is at ${memoryUsage}%`,
          timestamp: new Date(),
          service: null as any
        });
      }

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      logger.error('Error getting alerts:', error);
      next(error);
    }
  };

  getRecentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);

      const services: Service[] = await serviceRepository.find({
        order: { updatedAt: 'DESC' },
        take: 20
      });

      const activities = services.map((service: Service, index: number) => ({
        id: index + 1,
        type: 'service_update',
        message: `Service ${service.name} was ${
          service.status === ServiceStatus.ONLINE ? 'marked as online' :
          service.status === ServiceStatus.OFFLINE ? 'marked as offline' :
          'updated'
        }`,
        timestamp: service.updatedAt,
        metadata: {
          serviceId: service.id,
          serviceName: service.name,
          serviceType: 'service',
          status: service.status
        }
      }));

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      next(error);
    }
  };
}
