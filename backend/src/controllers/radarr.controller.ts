import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { dbConnection } from '../database/connection';
import { Service } from '../models/Service';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export class RadarrController {
  /**
   * Get download queue
   */
  getQueue = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const service = await this.getServiceConfig(id);
      
      if (!service) {
        res.status(404).json({
          success: false,
          error: { message: 'Service not found' }
        });
        return;
      }

      if (!service.config?.url || !service.config?.api_key) {
        res.status(400).json({
          success: false,
          error: { message: 'Service not configured. Please add URL and API key in settings.' }
        });
        return;
      }

      const response = await axios.get(`${service.config.url}/api/v3/queue`, {
        headers: {
          'X-Api-Key': service.config.api_key
        },
        timeout: 10000
      });

      res.json({
        success: true,
        data: response.data
      });
    } catch (error) {
      logger.error('Error fetching Radarr queue:', error);
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          success: false,
          error: { message: error.response?.data?.message || 'Failed to connect to Radarr' }
        });
      } else {
        next(error);
      }
    }
  };

  /**
   * Get upcoming movies
   */
  getUpcoming = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const service = await this.getServiceConfig(id);
      
      if (!service) {
        res.status(404).json({
          success: false,
          error: { message: 'Service not found' }
        });
        return;
      }

      if (!service.config?.url || !service.config?.api_key) {
        res.status(400).json({
          success: false,
          error: { message: 'Service not configured. Please add URL and API key in settings.' }
        });
        return;
      }

      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 30); // Next 30 days

      const response = await axios.get(`${service.config.url}/api/v3/calendar`, {
        headers: {
          'X-Api-Key': service.config.api_key
        },
        params: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        timeout: 10000
      });

      res.json({
        success: true,
        data: response.data
      });
    } catch (error) {
      logger.error('Error fetching Radarr calendar:', error);
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          success: false,
          error: { message: error.response?.data?.message || 'Failed to connect to Radarr' }
        });
      } else {
        next(error);
      }
    }
  };

  /**
   * Get missing movies count
   */
  getMissing = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const service = await this.getServiceConfig(id);
      
      if (!service) {
        res.status(404).json({
          success: false,
          error: { message: 'Service not found' }
        });
        return;
      }

      if (!service.config?.url || !service.config?.api_key) {
        res.status(400).json({
          success: false,
          error: { message: 'Service not configured. Please add URL and API key in settings.' }
        });
        return;
      }

      const response = await axios.get(`${service.config.url}/api/v3/wanted/missing`, {
        headers: {
          'X-Api-Key': service.config.api_key
        },
        params: {
          pageSize: 1 // We just need the count
        },
        timeout: 10000
      });

      res.json({
        success: true,
        data: {
          totalRecords: response.data.totalRecords
        }
      });
    } catch (error) {
      logger.error('Error fetching Radarr missing movies:', error);
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          success: false,
          error: { message: error.response?.data?.message || 'Failed to connect to Radarr' }
        });
      } else {
        next(error);
      }
    }
  };

  /**
   * Get system status
   */
  getStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const service = await this.getServiceConfig(id);
      
      if (!service) {
        res.status(404).json({
          success: false,
          error: { message: 'Service not found' }
        });
        return;
      }

      if (!service.config?.url || !service.config?.api_key) {
        res.status(400).json({
          success: false,
          error: { message: 'Service not configured. Please add URL and API key in settings.' }
        });
        return;
      }

      // Fetch system status
      const statusResponse = await axios.get(`${service.config.url}/api/v3/system/status`, {
        headers: {
          'X-Api-Key': service.config.api_key
        },
        timeout: 10000
      });

      // Fetch movie count
      const moviesResponse = await axios.get(`${service.config.url}/api/v3/movie`, {
        headers: {
          'X-Api-Key': service.config.api_key
        },
        timeout: 10000
      });

      // Fetch health issues
      const healthResponse = await axios.get(`${service.config.url}/api/v3/health`, {
        headers: {
          'X-Api-Key': service.config.api_key
        },
        timeout: 10000
      });

      // Update service status
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);
      await serviceRepository.update(id, {
        status: 'online',
        lastChecked: new Date()
      });

      res.json({
        success: true,
        data: {
          version: statusResponse.data.version,
          movieCount: moviesResponse.data.length,
          health: healthResponse.data.filter((issue: any) => issue.type === 'error')
        }
      });
    } catch (error) {
      logger.error('Error fetching Radarr status:', error);
      
      // Update service status to offline
      try {
        const dataSource = dbConnection.getDataSource();
        const serviceRepository = dataSource.getRepository(Service);
        await serviceRepository.update(req.params.id, {
          status: 'offline',
          lastChecked: new Date()
        });
      } catch (updateError) {
        logger.error('Error updating service status:', updateError);
      }

      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          success: false,
          error: { message: error.response?.data?.message || 'Failed to connect to Radarr' }
        });
      } else {
        next(error);
      }
    }
  };

  /**
   * Test connection
   */
  testConnection = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const service = await this.getServiceConfig(id);
      
      if (!service) {
        res.status(404).json({
          success: false,
          error: { message: 'Service not found' }
        });
        return;
      }

      if (!service.config?.url || !service.config?.api_key) {
        res.status(400).json({
          success: false,
          error: { message: 'Service not configured. Please add URL and API key in settings.' }
        });
        return;
      }

      const response = await axios.get(`${service.config.url}/api/v3/system/status`, {
        headers: {
          'X-Api-Key': service.config.api_key
        },
        timeout: 5000
      });

      // Update service status
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);
      await serviceRepository.update(id, {
        status: 'online',
        lastChecked: new Date()
      });

      res.json({
        success: true,
        message: 'Connection successful',
        data: {
          version: response.data.version,
          appName: response.data.appName
        }
      });
    } catch (error) {
      logger.error('Error testing Radarr connection:', error);
      
      // Update service status to offline
      try {
        const dataSource = dbConnection.getDataSource();
        const serviceRepository = dataSource.getRepository(Service);
        await serviceRepository.update(req.params.id, {
          status: 'offline',
          lastChecked: new Date()
        });
      } catch (updateError) {
        logger.error('Error updating service status:', updateError);
      }

      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          success: false,
          error: { 
            message: error.response?.status === 401 
              ? 'Invalid API key' 
              : error.response?.data?.message || 'Failed to connect to Radarr. Check URL and API key.'
          }
        });
      } else {
        next(error);
      }
    }
  };

  /**
   * Helper to get service configuration
   */
  private async getServiceConfig(id: string): Promise<Service | null> {
    const dataSource = dbConnection.getDataSource();
    const serviceRepository = dataSource.getRepository(Service);
    
    return await serviceRepository.findOne({
      where: { id },
      relations: ['definition']
    });
  }
}