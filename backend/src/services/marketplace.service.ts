import { promises as fs } from 'fs';
import path from 'path';
import { dbConnection } from '@/database/connection';
import { ServiceDefinition, ServiceDefinitionStatus, ServiceDefinitionCategory } from '../models/ServiceDefinition';
import { logger } from '../utils/logger';
import axios from 'axios';

export interface MarketplaceConfig {
  localPath?: string;
  remoteUrl?: string;
  autoSync?: boolean;
  syncInterval?: number; // in minutes
}

export class MarketplaceService {
  private static instance: MarketplaceService;
  private config: MarketplaceConfig;
  private syncTimer?: NodeJS.Timeout;

  private constructor(config: MarketplaceConfig = {}) {
    this.config = {
      localPath: config.localPath || path.join(process.cwd(), '..', 'marketplace'),
      remoteUrl: config.remoteUrl || process.env.MARKETPLACE_REPO_URL || 'https://raw.githubusercontent.com/TOoSmOotH/homie/main',
      // Always enable auto-sync by default so fresh instances pull from marketplace
      autoSync: config.autoSync !== undefined ? config.autoSync : (process.env.MARKETPLACE_AUTO_SYNC ? process.env.MARKETPLACE_AUTO_SYNC === 'true' : true),
      syncInterval: config.syncInterval || parseInt(process.env.MARKETPLACE_SYNC_INTERVAL || '60', 10) // Default: sync every hour
    };
  }

  public static getInstance(config?: MarketplaceConfig): MarketplaceService {
    if (!MarketplaceService.instance) {
      MarketplaceService.instance = new MarketplaceService(config);
    }
    return MarketplaceService.instance;
  }

  /**
   * Initialize the marketplace service
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing marketplace service...');
      
      // In production or when explicitly disabled, skip loading local marketplace files
      const disableLocal = process.env.MARKETPLACE_DISABLE_LOCAL === 'true' || process.env.NODE_ENV === 'production';
      if (disableLocal) {
        logger.info('Skipping local marketplace loading (production or disabled)');
      } else {
        await this.loadLocalDefinitions();
      }
      
      // Start auto-sync if enabled
      if (this.config.autoSync) {
        this.startAutoSync();
      }
      
      logger.info('Marketplace service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize marketplace service:', error);
      throw error;
    }
  }

  /**
   * Load service definitions from local marketplace folder
   */
  public async loadLocalDefinitions(): Promise<void> {
    try {
      const marketplacePath = this.config.localPath!;
      const servicesPath = path.join(marketplacePath, 'services');
      
      // Check if marketplace directory exists
      if (!await this.pathExists(servicesPath)) {
        logger.warn(`Marketplace directory not found: ${servicesPath}`);
        return;
      }

      // Get all category directories
      const categories = await fs.readdir(servicesPath);
      
      for (const category of categories) {
        const categoryPath = path.join(servicesPath, category);
        const stat = await fs.stat(categoryPath);
        
        if (stat.isDirectory()) {
          await this.loadCategoryServices(category, categoryPath);
        }
      }
      
      logger.info('Local marketplace definitions loaded successfully');
    } catch (error) {
      logger.error('Failed to load local marketplace definitions:', error);
      throw error;
    }
  }

  /**
   * Load services from a category directory
   */
  private async loadCategoryServices(category: string, categoryPath: string): Promise<void> {
    try {
      const files = await fs.readdir(categoryPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const filePath = path.join(categoryPath, file);
        await this.loadServiceDefinition(filePath, category);
      }
    } catch (error) {
      logger.error(`Failed to load services from category ${category}:`, error);
    }
  }

  /**
   * Load a single service definition from a JSON file
   */
  private async loadServiceDefinition(filePath: string, category: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const definition = JSON.parse(content);
      
      // Validate the definition (basic validation)
      if (!definition.id || !definition.name || !definition.version) {
        logger.warn(`Invalid service definition in ${filePath}`);
        return;
      }
      
      // Save or update in database
      await this.saveServiceDefinition(definition);
      
      logger.info(`Loaded service definition: ${definition.name} (${definition.id})`);
    } catch (error) {
      logger.error(`Failed to load service definition from ${filePath}:`, error);
    }
  }

  /**
   * Save or update a service definition in the database
   */
  private async saveServiceDefinition(manifest: any): Promise<void> {
    try {
      const dataSource = dbConnection.getDataSource();
      const repository = dataSource.getRepository(ServiceDefinition);
      
      // Check if definition already exists
      let definition = await repository.findOne({
        where: { serviceId: manifest.id }
      });
      
      if (definition) {
        // Update existing definition
        definition.name = manifest.name;
        definition.displayName = manifest.name;
        definition.version = manifest.version;
        definition.author = manifest.author;
        definition.description = manifest.description;
        definition.longDescription = manifest.longDescription;
        definition.icon = manifest.icon || '📦';
        definition.category = this.mapCategory(manifest.category);
        definition.tags = manifest.tags || [];
        definition.homepage = manifest.homepage;
        definition.repository = manifest.repository;
        definition.documentation = manifest.documentation;
        definition.manifest = manifest;
        definition.featured = manifest.featured || false;
        definition.official = manifest.official || false;
      } else {
        // Create new definition
        definition = repository.create({
          serviceId: manifest.id,
          name: manifest.name,
          displayName: manifest.name,
          version: manifest.version,
          author: manifest.author,
          description: manifest.description,
          longDescription: manifest.longDescription,
          icon: manifest.icon || '📦',
          category: this.mapCategory(manifest.category),
          tags: manifest.tags || [],
          homepage: manifest.homepage,
          repository: manifest.repository,
          documentation: manifest.documentation,
          manifest: manifest,
          status: ServiceDefinitionStatus.AVAILABLE,
          featured: manifest.featured || false,
          official: manifest.official || false,
          installCount: 0,
          reviewCount: 0
        });
      }
      
      await repository.save(definition);
    } catch (error) {
      logger.error('Failed to save service definition:', error);
      throw error;
    }
  }

  /**
   * Map string category to enum
   */
  private mapCategory(category: string): ServiceDefinitionCategory {
    const categoryMap: Record<string, ServiceDefinitionCategory> = {
      'media': ServiceDefinitionCategory.MEDIA,
      'automation': ServiceDefinitionCategory.AUTOMATION,
      'monitoring': ServiceDefinitionCategory.MONITORING,
      'networking': ServiceDefinitionCategory.NETWORKING,
      'storage': ServiceDefinitionCategory.STORAGE,
      'security': ServiceDefinitionCategory.SECURITY,
      'development': ServiceDefinitionCategory.DEVELOPMENT,
      'productivity': ServiceDefinitionCategory.PRODUCTIVITY,
      'communication': ServiceDefinitionCategory.COMMUNICATION,
      'gaming': ServiceDefinitionCategory.GAMING,
      'home-automation': ServiceDefinitionCategory.HOME_AUTOMATION,
      'data': ServiceDefinitionCategory.DATA,
      'infrastructure': ServiceDefinitionCategory.INFRASTRUCTURE,
      'other': ServiceDefinitionCategory.OTHER
    };
    
    return categoryMap[category] || ServiceDefinitionCategory.OTHER;
  }

  /**
   * Sync marketplace definitions from remote repository
   */
  public async syncFromRemote(): Promise<void> {
    try {
      logger.info('Syncing marketplace from remote repository...');
      logger.info(`Remote URL: ${this.config.remoteUrl}`);
      
      // Fetch marketplace metadata
      const metadataUrl = `${this.config.remoteUrl}/marketplace/marketplace.json`;
      const response = await axios.get(metadataUrl, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Homie-Marketplace-Client/1.0'
        }
      });
      const metadata = response.data;
      
      logger.info(`Remote marketplace version: ${metadata.version}`);
      
      // Sync each category with its service list
      for (const category of metadata.categories) {
        const serviceIds = metadata.services?.[category.id] || [];
        await this.syncCategory(category.id, serviceIds);
      }
      
      // Update local marketplace metadata
      await this.updateLocalMetadata(metadata);
      
      logger.info('Remote marketplace sync completed');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Failed to sync from remote marketplace: ${error.message}`);
        if (error.response) {
          logger.error(`Response status: ${error.response.status}`);
        }
      } else {
        logger.error('Failed to sync from remote marketplace:', error);
      }
    }
  }

  /**
   * Sync a specific category from remote
   */
  private async syncCategory(categoryId: string, serviceIds?: string[]): Promise<void> {
    try {
      logger.info(`Syncing category: ${categoryId}`);
      
      // If service IDs are provided (from marketplace.json), use those
      if (serviceIds && serviceIds.length > 0) {
        for (const serviceId of serviceIds) {
          await this.syncServiceDefinition(categoryId, `${serviceId}.json`);
        }
      } else {
        // Fallback to known services
        await this.syncKnownServices(categoryId);
      }
    } catch (error) {
      logger.error(`Failed to sync category ${categoryId}:`, error);
    }
  }

  /**
   * Sync known services from a category (for GitHub raw content)
   */
  private async syncKnownServices(categoryId: string): Promise<void> {
    // List of known services per category
    const knownServices: Record<string, string[]> = {
      'media': ['plex.json', 'jellyfin.json', 'emby.json', 'kodi.json'],
      'automation': ['radarr.json', 'sonarr.json', 'bazarr.json', 'lidarr.json', 'readarr.json'],
      'monitoring': ['grafana.json', 'prometheus.json', 'influxdb.json', 'telegraf.json'],
      'networking': ['pihole.json', 'traefik.json', 'nginx-proxy-manager.json', 'wireguard.json'],
      'storage': ['nextcloud.json', 'syncthing.json', 'filebrowser.json', 'minio.json'],
      'home-automation': ['homeassistant.json', 'nodered.json', 'mosquitto.json'],
      'development': ['gitea.json', 'gitlab.json', 'jenkins.json', 'drone.json'],
      'other': []
    };

    const services = knownServices[categoryId] || [];
    
    for (const serviceFile of services) {
      await this.syncServiceDefinition(categoryId, serviceFile);
    }
  }

  /**
   * Sync a single service definition from remote
   */
  private async syncServiceDefinition(categoryId: string, filename: string): Promise<void> {
    try {
      const serviceUrl = `${this.config.remoteUrl}/marketplace/services/${categoryId}/${filename}`;
      
      const response = await axios.get(serviceUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Homie-Marketplace-Client/1.0'
        },
        validateStatus: (status) => status === 200 // Only accept 200 as valid
      });
      
      if (response.data && response.data.id) {
        await this.saveServiceDefinition(response.data);
        logger.info(`Synced service: ${response.data.name} (${response.data.id})`);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Service doesn't exist in remote, that's okay
        logger.debug(`Service not found in remote: ${categoryId}/${filename}`);
      } else {
        logger.error(`Failed to sync service ${categoryId}/${filename}:`, error);
      }
    }
  }

  /**
   * Update local marketplace metadata
   */
  private async updateLocalMetadata(metadata: any): Promise<void> {
    try {
      const localMetadataPath = path.join(this.config.localPath!, 'marketplace.json');
      
      // Merge with local metadata to preserve local-only fields
      let localMetadata: any = {};
      
      if (await this.pathExists(localMetadataPath)) {
        const content = await fs.readFile(localMetadataPath, 'utf-8');
        localMetadata = JSON.parse(content);
      }
      
      const updatedMetadata = {
        ...localMetadata,
        ...metadata,
        lastSync: new Date().toISOString(),
        syncedFrom: this.config.remoteUrl
      };
      
      await fs.writeFile(
        localMetadataPath,
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );
      
      logger.info('Updated local marketplace metadata');
    } catch (error) {
      logger.error('Failed to update local metadata:', error);
    }
  }

  /**
   * Start automatic synchronization
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    const intervalMs = this.config.syncInterval! * 60 * 1000;
    
    this.syncTimer = setInterval(() => {
      this.syncFromRemote().catch(error => {
        logger.error('Auto-sync failed:', error);
      });
    }, intervalMs);
    
    logger.info(`Auto-sync enabled: syncing every ${this.config.syncInterval} minutes`);
  }

  /**
   * Stop automatic synchronization
   */
  public stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
      logger.info('Auto-sync disabled');
    }
  }

  /**
   * Get all available service definitions
   */
  public async getAvailableServices(): Promise<ServiceDefinition[]> {
    try {
      const dataSource = dbConnection.getDataSource();
      const repository = dataSource.getRepository(ServiceDefinition);
      
      return await repository.find({
        where: { status: ServiceDefinitionStatus.AVAILABLE },
        order: {
          featured: 'DESC',
          installCount: 'DESC',
          name: 'ASC'
        }
      });
    } catch (error) {
      logger.error('Failed to get available services:', error);
      throw error;
    }
  }

  /**
   * Get service definitions by category
   */
  public async getServicesByCategory(category: ServiceDefinitionCategory): Promise<ServiceDefinition[]> {
    try {
      const dataSource = dbConnection.getDataSource();
      const repository = dataSource.getRepository(ServiceDefinition);
      
      return await repository.find({
        where: { 
          category,
          status: ServiceDefinitionStatus.AVAILABLE 
        },
        order: {
          featured: 'DESC',
          installCount: 'DESC',
          name: 'ASC'
        }
      });
    } catch (error) {
      logger.error('Failed to get services by category:', error);
      throw error;
    }
  }

  /**
   * Get a specific service definition
   */
  public async getServiceDefinition(serviceId: string): Promise<ServiceDefinition | null> {
    try {
      const dataSource = dbConnection.getDataSource();
      const repository = dataSource.getRepository(ServiceDefinition);
      
      return await repository.findOne({
        where: { serviceId }
      });
    } catch (error) {
      logger.error('Failed to get service definition:', error);
      throw error;
    }
  }

  /**
   * Search service definitions
   */
  public async searchServices(query: string): Promise<ServiceDefinition[]> {
    try {
      const dataSource = dbConnection.getDataSource();
      const repository = dataSource.getRepository(ServiceDefinition);
      
      // Simple search in name, description, and tags
      // In production, you'd want to use full-text search
      const services = await repository.find({
        where: { status: ServiceDefinitionStatus.AVAILABLE }
      });
      
      const lowerQuery = query.toLowerCase();
      return services.filter((service: ServiceDefinition) => 
        service.name.toLowerCase().includes(lowerQuery) ||
        service.description.toLowerCase().includes(lowerQuery) ||
        service.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      logger.error('Failed to search services:', error);
      throw error;
    }
  }

  /**
   * Check if a path exists
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get marketplace statistics
   */
  public async getStatistics(): Promise<any> {
    try {
      const dataSource = dbConnection.getDataSource();
      const repository = dataSource.getRepository(ServiceDefinition);
      
      const [total, featured, official] = await Promise.all([
        repository.count(),
        repository.count({ where: { featured: true } }),
        repository.count({ where: { official: true } })
      ]);
      
      return {
        totalServices: total,
        featuredServices: featured,
        officialServices: official,
        lastSync: new Date()
      };
    } catch (error) {
      logger.error('Failed to get marketplace statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const marketplaceService = MarketplaceService.getInstance();
