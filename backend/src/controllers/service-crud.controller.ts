import { Request, Response, NextFunction } from 'express';
import { dbConnection } from '@/database/connection';
import { Service, ServiceStatus } from '../models/Service';
import { ServiceDefinition } from '../models/ServiceDefinition';
import { logger } from '../utils/logger';
import axios from 'axios';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export class ServiceCrudController {
  // Get all services
  getAllServices = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);

      const services = await serviceRepository.find({
        relations: ['definition'],
        order: { createdAt: 'DESC' }
      });

      // Transform services to include manifest data at the definition level
      const transformedServices = services.map((service: Service) => ({
        ...service,
        definition: service.definition ? {
          ...service.definition,
          ...(service.definition.manifest || {}),
          // Keep the original id and other fields
          id: service.definition.id,
          serviceId: service.definition.serviceId
        } : null
      }));

      res.json({
        success: true,
        data: transformedServices
      });
    } catch (error) {
      logger.error('Error getting services:', error);
      next(error);
    }
  };

  // Get a single service by ID
  getServiceById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
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

      // Transform service to include manifest data at the definition level
      const transformedService = {
        ...service,
        definition: service.definition ? {
          ...service.definition,
          ...(service.definition.manifest || {}),
          // Keep the original id and other fields
          id: service.definition.id,
          serviceId: service.definition.serviceId
        } : null
      };

      res.json({
        success: true,
        data: transformedService
      });
    } catch (error) {
      logger.error('Error getting service:', error);
      next(error);
    }
  };

  // Create a new service instance from a marketplace definition
  createService = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, definitionId, url, description, config } = req.body;
      
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);
      const definitionRepository = dataSource.getRepository(ServiceDefinition);

      // Validate required fields
      if (!name || !definitionId) {
        res.status(400).json({
          success: false,
          error: { message: 'Name and definition ID are required' }
        });
        return;
      }

      // Get the service definition
      const definition = await definitionRepository.findOne({
        where: { id: definitionId }
      });

      if (!definition) {
        res.status(404).json({
          success: false,
          error: { message: 'Service definition not found' }
        });
        return;
      }

      const service = serviceRepository.create({
        name,
        definition,
        url,
        description,
        config,
        status: ServiceStatus.UNKNOWN,
        enabled: true,
        autoStart: false,
        user: req.user
      });

      const savedService = await serviceRepository.save(service);

      // Check status if URL is provided
      if (url) {
        this.checkServiceStatus(savedService.id).catch(err => {
          logger.error('Error checking initial service status:', err);
        });
      }

      // Increment install count for the definition
      definition.installCount = (definition.installCount || 0) + 1;
      await definitionRepository.save(definition);

      res.status(201).json({
        success: true,
        data: savedService
      });
    } catch (error) {
      logger.error('Error creating service:', error);
      next(error);
    }
  };

  // Update a service
  updateService = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, url, description, config, status, enabled, autoStart } = req.body;
      
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

      // Update fields
      if (name !== undefined) service.name = name;
      if (url !== undefined) service.url = url;
      if (description !== undefined) service.description = description;
      if (config !== undefined) service.config = config;
      if (status !== undefined && Object.values(ServiceStatus).includes(status as ServiceStatus)) {
        service.status = status as ServiceStatus;
      }
      if (enabled !== undefined) service.enabled = enabled;
      if (autoStart !== undefined) service.autoStart = autoStart;

      const updatedService = await serviceRepository.save(service);

      // Transform service to include manifest data at the definition level
      const transformedService = {
        ...updatedService,
        definition: updatedService.definition ? {
          ...updatedService.definition,
          ...(updatedService.definition.manifest || {}),
          // Keep the original id and other fields
          id: updatedService.definition.id,
          serviceId: updatedService.definition.serviceId
        } : null
      };

      res.json({
        success: true,
        data: transformedService
      });
    } catch (error) {
      logger.error('Error updating service:', error);
      next(error);
    }
  };

  // Delete a service
  deleteService = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);

      const service = await serviceRepository.findOne({ where: { id } });

      if (!service) {
        res.status(404).json({
          success: false,
          error: { message: 'Service not found' }
        });
        return;
      }

      await serviceRepository.remove(service);

      res.json({
        success: true,
        message: 'Service deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting service:', error);
      next(error);
    }
  };

  // Check service status
  checkServiceStatus = async (serviceId: string): Promise<ServiceStatus> => {
    try {
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);

      const service = await serviceRepository.findOne({ where: { id: serviceId } });

      if (!service) {
        throw new Error('Service not found');
      }

      let status = ServiceStatus.UNKNOWN;

      if (service.url) {
        try {
          // Attempt to reach the service
          const response = await axios.get(service.url, {
            timeout: 5000,
            validateStatus: () => true // Accept any status code
          });
          
          // Consider 2xx and 3xx as online, 401/403 also means service is responding
          if (response.status < 500) {
            status = ServiceStatus.ONLINE;
          } else {
            status = ServiceStatus.OFFLINE;
          }
        } catch (error) {
          // Network error or timeout
          status = ServiceStatus.OFFLINE;
        }
      }

      // Update service status
      service.status = status;
      service.lastChecked = new Date();
      await serviceRepository.save(service);

      return status;
    } catch (error) {
      logger.error('Error checking service status:', error);
      throw error;
    }
  };

  // Check status endpoint
  checkStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      const status = await this.checkServiceStatus(id);

      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);
      const service = await serviceRepository.findOne({ where: { id } });

      res.json({
        success: true,
        data: {
          status,
          lastChecked: service?.lastChecked,
          service
        }
      });
    } catch (error) {
      logger.error('Error checking service status:', error);
      next(error);
    }
  };

  // Batch check all services
  checkAllServices = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);

      const services = await serviceRepository.find();
      const results = [];

      for (const service of services) {
        try {
          const status = await this.checkServiceStatus(service.id);
          results.push({
            id: service.id,
            name: service.name,
            status,
            lastChecked: new Date()
          });
        } catch (error) {
          results.push({
            id: service.id,
            name: service.name,
            status: ServiceStatus.UNKNOWN,
            error: 'Failed to check status'
          });
        }
      }

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Error checking all services:', error);
      next(error);
    }
  };
}
