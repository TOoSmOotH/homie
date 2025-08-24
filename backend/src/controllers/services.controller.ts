import { Request, Response, NextFunction } from 'express';
import { ServiceAdapterFactory } from '../services/adapters/ServiceAdapterFactory';
import { ServiceType, AuthenticationType } from '../models/ServiceConfig';
import { AdapterResponse } from '../types/adapter.types';
import { logger } from '../utils/logger';
import { RadarrAdapter } from '../services/adapters/RadarrAdapter';
import { SabnzbdAdapter } from '../services/adapters/SabnzbdAdapter';
import WebSocketService, { ServiceStatusUpdate } from '../services/websocket.service';

interface ServiceActionRequest {
  serviceConfig?: {
    baseUrl: string;
    port?: number;
    apiKey?: string;
    username?: string;
    password?: string;
    useSSL?: boolean;
  };
}

export class ServicesController {
  private adapterFactory = new ServiceAdapterFactory();
  private wsService?: WebSocketService;

  // Set WebSocket service instance
  setWebSocketService(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  // Get all available services
  getServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Return list of supported service types
      const supportedServices = [
        {
          type: ServiceType.RADARR,
          name: 'Radarr',
          description: 'Movie management and download automation',
          defaultPort: 7878,
          icon: '🎬'
        },
        {
          type: ServiceType.SONARR,
          name: 'Sonarr',
          description: 'TV series management and download automation',
          defaultPort: 8989,
          icon: '📺'
        },
        {
          type: ServiceType.SABNZBD,
          name: 'Sabnzbd',
          description: 'Binary download management and automation',
          defaultPort: 8080,
          icon: '⬇️'
        },
        {
          type: ServiceType.PROXMOX,
          name: 'Proxmox',
          description: 'Virtualization platform management',
          defaultPort: 8006,
          icon: '🖥️'
        },
        {
          type: ServiceType.DOCKER,
          name: 'Docker',
          description: 'Container management platform',
          defaultPort: 2376,
          icon: '🐳'
        }
      ];

      res.json({
        success: true,
        data: supportedServices
      });
    } catch (error) {
      logger.error('Error getting services:', error);
      next(error);
    }
  };

  // Get service by type with data
  getServiceByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceType } = req.params;
      const { baseUrl, port, apiKey, username, password, useSSL } = req.query;

      // Validate service type
      if (!Object.values(ServiceType).includes(serviceType as ServiceType)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid service type' }
        });
        return;
      }

      // Create adapter configuration
      const config = {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        username: username as string,
        password: password as string,
        useSSL: useSSL === 'true',
        authType: AuthenticationType.API_KEY
      };

      try {
        // Get adapter instance
        const adapter = await this.adapterFactory.createAdapter(serviceType as ServiceType, config);

        // Get service-specific data
        let serviceData: any = {};

        switch (serviceType) {
          case ServiceType.RADARR:
            const radarrAdapter = adapter as any;
            const [movies, queue, systemStatus] = await Promise.all([
              radarrAdapter.getMovies(),
              radarrAdapter.getQueue(),
              radarrAdapter.getSystemStatus()
            ]);
            serviceData = {
              movies: movies.data || [],
              queue: queue.data || [],
              systemStatus: systemStatus.data || {}
            };
            break;

          case ServiceType.SABNZBD:
            const sabnzbdAdapter = adapter as any;
            const [sabnzbdQueue, history, categories] = await Promise.all([
              sabnzbdAdapter.getQueue(),
              sabnzbdAdapter.getHistory(),
              sabnzbdAdapter.getCategories()
            ]);
            serviceData = {
              queue: sabnzbdQueue.data || {},
              history: history.data || {},
              categories: categories.data || []
            };
            break;

          default:
            serviceData = { message: 'Service data not implemented yet' };
        }

        res.json({
          success: true,
          data: {
            serviceType,
            ...serviceData
          }
        });

      } catch (adapterError) {
        logger.error(`Error creating adapter for ${serviceType}:`, adapterError);
        res.status(500).json({
          success: false,
          error: { message: 'Failed to connect to service' }
        });
      }

    } catch (error) {
      logger.error('Error getting service by type:', error);
      next(error);
    }
  };

  // Get service status/health check
  getServiceStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceType } = req.params;
      const { baseUrl, port, apiKey, username, password, useSSL } = req.body;

      if (!Object.values(ServiceType).includes(serviceType as ServiceType)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid service type' }
        });
        return;
      }

      const config = {
        baseUrl,
        port,
        apiKey,
        username,
        password,
        useSSL,
        authType: AuthenticationType.API_KEY
      };

      try {
        const adapter = await this.adapterFactory.createAdapter(serviceType as ServiceType, config);
        const healthCheck = await adapter.healthCheck();

        // Determine service status based on health check
        const isOnline = healthCheck.status === 'active';
        const status: 'online' | 'offline' | 'error' = healthCheck.status === 'active' ? 'online' : healthCheck.status === 'error' ? 'error' : 'offline';

        // Broadcast real-time status update
        if (this.wsService) {
          const statusUpdate: ServiceStatusUpdate = {
            serviceType: serviceType as ServiceType,
            status,
            message: isOnline ? 'Service is online' : 'Service is offline',
            data: healthCheck,
            timestamp: new Date()
          };

          this.wsService.broadcastServiceStatus(statusUpdate);

          // Send notification if status changed (you might want to track previous status)
          const notification = this.wsService.createServiceNotification(
            serviceType as ServiceType,
            status,
            status === 'online' ? `${serviceType} is now online` : `${serviceType} is now offline`,
            healthCheck
          );

          this.wsService.broadcastNotification(notification);
        }

        res.json({
          success: true,
          data: healthCheck
        });

      } catch (adapterError) {
        const errorMessage = adapterError instanceof Error ? adapterError.message : String(adapterError);
        logger.error(`Error checking health for ${serviceType}:`, adapterError);

        // Broadcast error status
        if (this.wsService) {
          const statusUpdate: ServiceStatusUpdate = {
            serviceType: serviceType as ServiceType,
            status: 'error',
            message: 'Failed to check service health',
            data: { error: errorMessage },
            timestamp: new Date()
          };

          this.wsService.broadcastServiceStatus(statusUpdate);

          const notification = this.wsService.createServiceNotification(
            serviceType as ServiceType,
            'error',
            `Failed to check health for ${serviceType}`,
            { error: errorMessage }
          );

          this.wsService.broadcastNotification(notification);
        }

        res.status(500).json({
          success: false,
          error: { message: 'Failed to check service health' }
        });
      }

    } catch (error) {
      logger.error('Error getting service status:', error);
      next(error);
    }
  };

  // Service control operations
  startService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // This would typically start a Docker container or service
      // For now, return placeholder response
      res.json({
        success: true,
        message: 'Service start operation - not implemented for this service type'
      });
    } catch (error) {
      logger.error('Error starting service:', error);
      next(error);
    }
  };

  stopService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // This would typically stop a Docker container or service
      res.json({
        success: true,
        message: 'Service stop operation - not implemented for this service type'
      });
    } catch (error) {
      logger.error('Error stopping service:', error);
      next(error);
    }
  };

  restartService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // This would typically restart a Docker container or service
      res.json({
        success: true,
        message: 'Service restart operation - not implemented for this service type'
      });
    } catch (error) {
      logger.error('Error restarting service:', error);
      next(error);
    }
  };

  // Radarr-specific methods
  getRadarrMovies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.RADARR, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      }) as RadarrAdapter;

      const response = await adapter.getMovies();
      res.json(response);
    } catch (error) {
      logger.error('Error getting Radarr movies:', error);
      next(error);
    }
  };

  getRadarrMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.RADARR, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      }) as RadarrAdapter;

      const response = await adapter.getMovieById(parseInt(id));
      res.json(response);
    } catch (error) {
      logger.error('Error getting Radarr movie:', error);
      next(error);
    }
  };

  addRadarrMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { baseUrl, apiKey, port } = req.query;
      const movieOptions = req.body;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.RADARR, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      }) as RadarrAdapter;

      const response = await adapter.addMovie(movieOptions);
      res.json(response);
    } catch (error) {
      logger.error('Error adding Radarr movie:', error);
      next(error);
    }
  };

  updateRadarrMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { baseUrl, apiKey, port } = req.query;
      const movieOptions = req.body;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.RADARR, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as RadarrAdapter).updateMovie(parseInt(id), movieOptions);
      res.json(response);
    } catch (error) {
      logger.error('Error updating Radarr movie:', error);
      next(error);
    }
  };

  deleteRadarrMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { baseUrl, apiKey, port, deleteFiles, addImportExclusion } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.RADARR, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as RadarrAdapter).deleteMovie(parseInt(id), deleteFiles === 'true', addImportExclusion === 'true');
      res.json(response);
    } catch (error) {
      logger.error('Error deleting Radarr movie:', error);
      next(error);
    }
  };

  getRadarrQualityProfiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.RADARR, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as RadarrAdapter).getQualityProfiles();
      res.json(response);
    } catch (error) {
      logger.error('Error getting Radarr quality profiles:', error);
      next(error);
    }
  };

  getRadarrQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.RADARR, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as RadarrAdapter).getQueue();
      res.json(response);
    } catch (error) {
      logger.error('Error getting Radarr queue:', error);
      next(error);
    }
  };

  searchRadarrMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.RADARR, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as RadarrAdapter).searchMovie(parseInt(id));
      res.json(response);
    } catch (error) {
      logger.error('Error searching Radarr movie:', error);
      next(error);
    }
  };

  // Sabnzbd-specific methods
  getSabnzbdQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.SABNZBD, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as SabnzbdAdapter).getQueue();
      res.json(response);
    } catch (error) {
      logger.error('Error getting Sabnzbd queue:', error);
      next(error);
    }
  };

  addSabnzbdNzb = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { baseUrl, apiKey, port } = req.query;
      const { url, category, priority, name } = req.body;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.SABNZBD, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as SabnzbdAdapter).addNzbByUrl(url, category, priority, name);
      res.json(response);
    } catch (error) {
      logger.error('Error adding Sabnzbd NZB:', error);
      next(error);
    }
  };

  pauseSabnzbdQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.SABNZBD, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as SabnzbdAdapter).pauseQueue();
      res.json(response);
    } catch (error) {
      logger.error('Error pausing Sabnzbd queue:', error);
      next(error);
    }
  };

  resumeSabnzbdQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.SABNZBD, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as SabnzbdAdapter).resumeQueue();
      res.json(response);
    } catch (error) {
      logger.error('Error resuming Sabnzbd queue:', error);
      next(error);
    }
  };

  pauseSabnzbdJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.SABNZBD, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as SabnzbdAdapter).pauseJob(id);
      res.json(response);
    } catch (error) {
      logger.error('Error pausing Sabnzbd job:', error);
      next(error);
    }
  };

  resumeSabnzbdJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.SABNZBD, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as SabnzbdAdapter).resumeJob(id);
      res.json(response);
    } catch (error) {
      logger.error('Error resuming Sabnzbd job:', error);
      next(error);
    }
  };

  deleteSabnzbdJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.SABNZBD, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as SabnzbdAdapter).deleteJob(id);
      res.json(response);
    } catch (error) {
      logger.error('Error deleting Sabnzbd job:', error);
      next(error);
    }
  };

  changeSabnzbdJobPriority = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { baseUrl, apiKey, port } = req.query;
      const { priority } = req.body;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.SABNZBD, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as SabnzbdAdapter).changeJobPriority(id, priority);
      res.json(response);
    } catch (error) {
      logger.error('Error changing Sabnzbd job priority:', error);
      next(error);
    }
  };

  getSabnzbdHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.SABNZBD, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as SabnzbdAdapter).getHistory();
      res.json(response);
    } catch (error) {
      logger.error('Error getting Sabnzbd history:', error);
      next(error);
    }
  };

  getSabnzbdCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { baseUrl, apiKey, port } = req.query;
      const adapter = await this.adapterFactory.createAdapter(ServiceType.SABNZBD, {
        baseUrl: baseUrl as string,
        port: port ? parseInt(port as string) : undefined,
        apiKey: apiKey as string,
        authType: AuthenticationType.API_KEY
      });

      const response = await (adapter as SabnzbdAdapter).getCategories();
      res.json(response);
    } catch (error) {
      logger.error('Error getting Sabnzbd categories:', error);
      next(error);
    }
  };
}