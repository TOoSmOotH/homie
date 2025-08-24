import { Request, Response, NextFunction } from 'express';
import { marketplaceService } from '../services/marketplace.service';
import { ServiceDefinitionCategory } from '../models/ServiceDefinition';
import { logger } from '../utils/logger';

export class MarketplaceController {
  /**
   * Get all available services from marketplace
   */
  getServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const services = await marketplaceService.getAvailableServices();
      
      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      logger.error('Error getting marketplace services:', error);
      next(error);
    }
  };

  /**
   * Get services by category
   */
  getServicesByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category } = req.params;
      
      // Validate category
      if (!Object.values(ServiceDefinitionCategory).includes(category as ServiceDefinitionCategory)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid category' }
        });
        return;
      }
      
      const services = await marketplaceService.getServicesByCategory(category as ServiceDefinitionCategory);
      
      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      logger.error('Error getting services by category:', error);
      next(error);
    }
  };

  /**
   * Get a specific service definition
   */
  getServiceDefinition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceId } = req.params;
      
      const definition = await marketplaceService.getServiceDefinition(serviceId);
      
      if (!definition) {
        res.status(404).json({
          success: false,
          error: { message: 'Service definition not found' }
        });
        return;
      }
      
      res.json({
        success: true,
        data: definition
      });
    } catch (error) {
      logger.error('Error getting service definition:', error);
      next(error);
    }
  };

  /**
   * Search marketplace services
   */
  searchServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          error: { message: 'Search query is required' }
        });
        return;
      }
      
      const services = await marketplaceService.searchServices(q);
      
      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      logger.error('Error searching marketplace services:', error);
      next(error);
    }
  };

  /**
   * Get marketplace categories
   */
  getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = [
        { id: 'media', name: 'Media & Entertainment', icon: '🎬', count: 0 },
        { id: 'automation', name: 'Automation', icon: '🤖', count: 0 },
        { id: 'monitoring', name: 'Monitoring & Analytics', icon: '📊', count: 0 },
        { id: 'networking', name: 'Networking', icon: '🌐', count: 0 },
        { id: 'storage', name: 'Storage & Backup', icon: '💾', count: 0 },
        { id: 'security', name: 'Security', icon: '🔒', count: 0 },
        { id: 'development', name: 'Development', icon: '👨‍💻', count: 0 },
        { id: 'productivity', name: 'Productivity', icon: '📝', count: 0 },
        { id: 'communication', name: 'Communication', icon: '💬', count: 0 },
        { id: 'gaming', name: 'Gaming', icon: '🎮', count: 0 },
        { id: 'home_automation', name: 'Home Automation', icon: '🏠', count: 0 },
        { id: 'data', name: 'Data & Databases', icon: '🗄️', count: 0 },
        { id: 'infrastructure', name: 'Infrastructure', icon: '🏗️', count: 0 },
        { id: 'other', name: 'Other', icon: '📦', count: 0 }
      ];
      
      // Get counts for each category
      for (const category of categories) {
        const services = await marketplaceService.getServicesByCategory(
          category.id.toUpperCase() as ServiceDefinitionCategory
        );
        category.count = services.length;
      }
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('Error getting marketplace categories:', error);
      next(error);
    }
  };

  /**
   * Get featured services
   */
  getFeaturedServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const allServices = await marketplaceService.getAvailableServices();
      const featured = allServices.filter(s => s.featured);
      
      res.json({
        success: true,
        data: featured
      });
    } catch (error) {
      logger.error('Error getting featured services:', error);
      next(error);
    }
  };

  /**
   * Sync marketplace from remote repository
   */
  syncMarketplace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Start sync in background
      marketplaceService.syncFromRemote().catch(error => {
        logger.error('Background sync failed:', error);
      });
      
      res.json({
        success: true,
        message: 'Marketplace sync initiated'
      });
    } catch (error) {
      logger.error('Error initiating marketplace sync:', error);
      next(error);
    }
  };

  /**
   * Get marketplace statistics
   */
  getStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await marketplaceService.getStatistics();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting marketplace statistics:', error);
      next(error);
    }
  };

  /**
   * Install a service from marketplace
   */
  installService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const { config } = req.body;
      
      // Get service definition
      const definition = await marketplaceService.getServiceDefinition(serviceId);
      
      if (!definition) {
        res.status(404).json({
          success: false,
          error: { message: 'Service definition not found' }
        });
        return;
      }
      
      // TODO: Implement actual installation logic
      // This would create a Service instance with the provided config
      // and potentially start a Docker container
      
      res.json({
        success: true,
        message: `Service ${definition.name} installation initiated`,
        data: {
          serviceId,
          definition,
          config
        }
      });
    } catch (error) {
      logger.error('Error installing service:', error);
      next(error);
    }
  };
}