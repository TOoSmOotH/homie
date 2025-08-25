import { Request, Response, NextFunction } from 'express';
import axios, { AxiosRequestConfig } from 'axios';
import { dbConnection } from '../database/connection';
import { Service, ServiceStatus } from '../models/Service';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export class GenericServiceController {
  /**
   * Generic data fetcher for any service based on marketplace definition
   */
  fetchData = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { endpoint, params } = req.body;

      // Get service with definition
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);
      
      const service = await serviceRepository.findOne({
        where: { id },
        relations: ['definition']
      });

      if (!service) {
        res.status(404).json({
          success: false,
          error: { message: 'Service not found' }
        });
        return;
      }

      // Check if service is configured
      if (!service.config?.url) {
        res.status(400).json({
          success: false,
          error: { message: 'Service not configured. Please configure in settings.' }
        });
        return;
      }

      // Get endpoint definition from marketplace
      const endpointDef = service.definition?.manifest?.api?.endpoints?.[endpoint];
      
      if (!endpointDef) {
        res.status(400).json({
          success: false,
          error: { message: `Unknown endpoint: ${endpoint}` }
        });
        return;
      }

      // Build request configuration
      const requestConfig: AxiosRequestConfig = {
        method: endpointDef.method || 'GET',
        url: `${service.config.url}${endpointDef.path}`,
        timeout: 10000
      };

      // Add headers
      const headers: any = {};
      if (service.definition?.manifest?.api?.headers) {
        for (const [key, value] of Object.entries(service.definition.manifest.api.headers)) {
          headers[key] = this.interpolateValue(value as string, service.config);
        }
      }
      requestConfig.headers = headers;

      // Add params
      if (endpointDef.params) {
        const interpolatedParams: any = {};
        for (const [key, value] of Object.entries(endpointDef.params)) {
          interpolatedParams[key] = this.interpolateValue(value as string, { ...service.config, ...params });
        }
        requestConfig.params = interpolatedParams;
      }

      // Add body for POST/PUT requests
      if (endpointDef.body && (endpointDef.method === 'POST' || endpointDef.method === 'PUT')) {
        requestConfig.data = endpointDef.body;
      }

      // Make the request
      const response = await axios(requestConfig);

      // Apply transformation if specified
      let responseData = response.data;
      if (endpointDef.transform) {
        try {
          const transformFn = new Function('response', `return ${endpointDef.transform}`);
          responseData = transformFn(response.data);
        } catch (e) {
          logger.error('Transform error:', e);
        }
      }

      // Update service status to online
      await serviceRepository.update(id, {
        status: ServiceStatus.ONLINE,
        lastChecked: new Date()
      });

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      logger.error('Error fetching service data:', error);
      
      // Update service status to offline if connection failed
      if (axios.isAxiosError(error)) {
        try {
          const dataSource = dbConnection.getDataSource();
          const serviceRepository = dataSource.getRepository(Service);
          await serviceRepository.update(req.params.id, {
            status: ServiceStatus.OFFLINE,
            lastChecked: new Date()
          });
        } catch (updateError) {
          logger.error('Error updating service status:', updateError);
        }

        res.status(error.response?.status || 500).json({
          success: false,
          error: { 
            message: error.response?.status === 401 
              ? 'Authentication failed. Check your credentials.'
              : error.response?.data?.message || 'Failed to connect to service'
          }
        });
      } else {
        next(error);
      }
    }
  };

  /**
   * Test service connection
   */
  testConnection = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Get service with definition
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);
      
      const service = await serviceRepository.findOne({
        where: { id },
        relations: ['definition']
      });

      if (!service) {
        res.status(404).json({
          success: false,
          error: { message: 'Service not found' }
        });
        return;
      }

      // Check if service is configured
      if (!service.config?.url) {
        res.status(400).json({
          success: false,
          error: { message: 'Service not configured' }
        });
        return;
      }

      // Get test endpoint from definition
      const testEndpoint = service.definition?.manifest?.connection?.testEndpoint;
      
      if (!testEndpoint) {
        res.status(400).json({
          success: false,
          error: { message: 'No test endpoint defined for this service' }
        });
        return;
      }

      // Build request
      const headers: any = {};
      if (testEndpoint.headers) {
        for (const [key, value] of Object.entries(testEndpoint.headers)) {
          headers[key] = this.interpolateValue(value as string, service.config);
        }
      }

      const response = await axios({
        method: testEndpoint.method || 'GET',
        url: `${service.config.url}${testEndpoint.path}`,
        headers,
        timeout: 5000
      });

      // Check for success indicator
      const success = testEndpoint.successIndicator 
        ? response.data[testEndpoint.successIndicator] !== undefined
        : response.status === (testEndpoint.expectedStatus || 200);

      if (success) {
        // Update service status
        await serviceRepository.update(id, {
          status: ServiceStatus.ONLINE,
          lastChecked: new Date()
        });

        res.json({
          success: true,
          message: 'Connection successful',
          data: response.data
        });
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      logger.error('Error testing connection:', error);
      
      // Update service status
      try {
        const dataSource = dbConnection.getDataSource();
        const serviceRepository = dataSource.getRepository(Service);
        await serviceRepository.update(req.params.id, {
          status: ServiceStatus.OFFLINE,
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
              ? 'Authentication failed'
              : 'Connection test failed'
          }
        });
      } else {
        next(error);
      }
    }
  };

  /**
   * Execute a quick action
   */
  executeAction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { actionId } = req.body;

      // Get service with definition
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);
      
      const service = await serviceRepository.findOne({
        where: { id },
        relations: ['definition']
      });

      if (!service) {
        res.status(404).json({
          success: false,
          error: { message: 'Service not found' }
        });
        return;
      }

      // Find the action
      const action = service.definition?.manifest?.quickActions?.find((a: any) => a.id === actionId);
      
      if (!action) {
        res.status(400).json({
          success: false,
          error: { message: `Unknown action: ${actionId}` }
        });
        return;
      }

      // Execute the action
      const headers: any = {};
      if (service.definition?.manifest?.api?.headers) {
        for (const [key, value] of Object.entries(service.definition.manifest.api.headers)) {
          headers[key] = this.interpolateValue(value as string, service.config);
        }
      }

      const response = await axios({
        method: action.api.method || 'POST',
        url: `${service.config.url}${action.api.endpoint}`,
        headers,
        data: action.api.body,
        timeout: 10000
      });

      res.json({
        success: true,
        message: `Action '${action.name}' executed successfully`,
        data: response.data
      });
    } catch (error) {
      logger.error('Error executing action:', error);
      
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          success: false,
          error: { message: 'Failed to execute action' }
        });
      } else {
        next(error);
      }
    }
  };

  /**
   * Helper to interpolate values with placeholders
   */
  private interpolateValue(template: string, data: any): string {
    return template.replace(/\{([^}]+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }
}