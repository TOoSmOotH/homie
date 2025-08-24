import { ServiceConfig } from '../../models/ServiceConfig';
import { ServiceType, AuthenticationType } from '../../models/ServiceConfig';
import { AdapterConfig, ConfigValidationResult } from '../../types/adapter.types';
import { serviceAdapterFactory } from './ServiceAdapterFactory';
import { logger } from '../../utils/logger';
import { DataSource } from 'typeorm';

// Configuration management class
export class AdapterConfigManager {
  private static instance: AdapterConfigManager;
  private dataSource: DataSource;

  static getInstance(dataSource: DataSource): AdapterConfigManager {
    if (!AdapterConfigManager.instance) {
      AdapterConfigManager.instance = new AdapterConfigManager(dataSource);
    }
    return AdapterConfigManager.instance;
  }

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  // Convert ServiceConfig entity to AdapterConfig
  async serviceConfigToAdapterConfig(serviceConfig: ServiceConfig): Promise<AdapterConfig> {
    const config: AdapterConfig = {
      baseUrl: serviceConfig.getFullUrl(),
      port: serviceConfig.port,
      timeout: serviceConfig.timeout,
      maxRetries: serviceConfig.maxRetries,
      useSSL: serviceConfig.useSSL,
      verifySSL: serviceConfig.verifySSL,
      headers: serviceConfig.headers || {},
      authType: serviceConfig.authType,
      apiKey: serviceConfig.apiKey,
      username: serviceConfig.username,
      password: serviceConfig.password,
      token: serviceConfig.token,
      certificate: serviceConfig.certificate,
      privateKey: serviceConfig.privateKey,
      serviceConfig: serviceConfig.serviceConfig || {}
    };

    return config;
  }

  // Create ServiceConfig from AdapterConfig
  async createServiceConfigFromAdapterConfig(
    adapterConfig: AdapterConfig,
    serviceType: ServiceType,
    userId: string,
    name: string,
    description?: string
  ): Promise<ServiceConfig> {
    const serviceConfig = new ServiceConfig();
    serviceConfig.name = name;
    serviceConfig.description = description;
    serviceConfig.serviceType = serviceType;
    serviceConfig.baseUrl = this.extractBaseUrl(adapterConfig.baseUrl);
    serviceConfig.port = adapterConfig.port;
    serviceConfig.authType = adapterConfig.authType;
    serviceConfig.apiKey = adapterConfig.apiKey;
    serviceConfig.username = adapterConfig.username;
    serviceConfig.password = adapterConfig.password;
    serviceConfig.token = adapterConfig.token;
    serviceConfig.certificate = adapterConfig.certificate;
    serviceConfig.privateKey = adapterConfig.privateKey;
    serviceConfig.serviceConfig = adapterConfig.serviceConfig;
    serviceConfig.timeout = adapterConfig.timeout || 5000;
    serviceConfig.maxRetries = adapterConfig.maxRetries || 3;
    serviceConfig.useSSL = adapterConfig.useSSL !== false;
    serviceConfig.verifySSL = adapterConfig.verifySSL !== false;
    serviceConfig.headers = adapterConfig.headers;
    serviceConfig.user = await this.getUserById(userId);

    return serviceConfig;
  }

  // Save ServiceConfig to database
  async saveServiceConfig(serviceConfig: ServiceConfig): Promise<ServiceConfig> {
    try {
      const serviceConfigRepository = this.dataSource.getRepository(ServiceConfig);
      const savedConfig = await serviceConfigRepository.save(serviceConfig);

      logger.info(`Service configuration saved: ${savedConfig.id}`);
      return savedConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to save service configuration', { error: errorMessage });
      throw error;
    }
  }

  // Get ServiceConfig by ID
  async getServiceConfig(id: string): Promise<ServiceConfig | null> {
    try {
      const serviceConfigRepository = this.dataSource.getRepository(ServiceConfig);
      return await serviceConfigRepository.findOne({
        where: { id },
        relations: ['user']
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get service configuration: ${id}`, { error: errorMessage });
      throw error;
    }
  }

  // Get ServiceConfig by service type and user
  async getServiceConfigsByType(
    serviceType: ServiceType,
    userId: string
  ): Promise<ServiceConfig[]> {
    try {
      const serviceConfigRepository = this.dataSource.getRepository(ServiceConfig);
      return await serviceConfigRepository.find({
        where: {
          serviceType,
          user: { id: userId }
        },
        relations: ['user']
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get service configurations for type: ${serviceType}`, {
        error: errorMessage
      });
      throw error;
    }
  }

  // Get all ServiceConfig for user
  async getUserServiceConfigs(userId: string): Promise<ServiceConfig[]> {
    try {
      const serviceConfigRepository = this.dataSource.getRepository(ServiceConfig);
      return await serviceConfigRepository.find({
        where: { user: { id: userId } },
        relations: ['user']
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get service configurations for user: ${userId}`, {
        error: errorMessage
      });
      throw error;
    }
  }

  // Update ServiceConfig
  async updateServiceConfig(
    id: string,
    updates: Partial<AdapterConfig>
  ): Promise<ServiceConfig> {
    try {
      const serviceConfig = await this.getServiceConfig(id);
      if (!serviceConfig) {
        throw new Error(`Service configuration not found: ${id}`);
      }

      // Apply updates
      if (updates.baseUrl) {
        serviceConfig.baseUrl = this.extractBaseUrl(updates.baseUrl);
      }
      if (updates.port !== undefined) {
        serviceConfig.port = updates.port;
      }
      if (updates.timeout !== undefined) {
        serviceConfig.timeout = updates.timeout;
      }
      if (updates.maxRetries !== undefined) {
        serviceConfig.maxRetries = updates.maxRetries;
      }
      if (updates.useSSL !== undefined) {
        serviceConfig.useSSL = updates.useSSL;
      }
      if (updates.verifySSL !== undefined) {
        serviceConfig.verifySSL = updates.verifySSL;
      }
      if (updates.headers) {
        serviceConfig.headers = { ...serviceConfig.headers, ...updates.headers };
      }
      if (updates.apiKey !== undefined) {
        serviceConfig.apiKey = updates.apiKey;
      }
      if (updates.username !== undefined) {
        serviceConfig.username = updates.username;
      }
      if (updates.password !== undefined) {
        serviceConfig.password = updates.password;
      }
      if (updates.token !== undefined) {
        serviceConfig.token = updates.token;
      }
      if (updates.certificate !== undefined) {
        serviceConfig.certificate = updates.certificate;
      }
      if (updates.privateKey !== undefined) {
        serviceConfig.privateKey = updates.privateKey;
      }
      if (updates.serviceConfig) {
        serviceConfig.serviceConfig = {
          ...serviceConfig.serviceConfig,
          ...updates.serviceConfig
        };
      }

      const updatedConfig = await this.saveServiceConfig(serviceConfig);
      logger.info(`Service configuration updated: ${id}`);
      return updatedConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to update service configuration: ${id}`, {
        error: errorMessage
      });
      throw error;
    }
  }

  // Delete ServiceConfig
  async deleteServiceConfig(id: string): Promise<boolean> {
    try {
      const serviceConfigRepository = this.dataSource.getRepository(ServiceConfig);
      const result = await serviceConfigRepository.delete(id);

      if (result.affected && result.affected > 0) {
        logger.info(`Service configuration deleted: ${id}`);
        return true;
      }

      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to delete service configuration: ${id}`, {
        error: errorMessage
      });
      throw error;
    }
  }

  // Test service configuration
  async testServiceConfig(serviceConfig: ServiceConfig): Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      const adapterConfig = await this.serviceConfigToAdapterConfig(serviceConfig);
      const adapter = await serviceAdapterFactory.createAdapter(
        serviceConfig.serviceType,
        adapterConfig
      );

      const healthCheck = await adapter.healthCheck();

      return {
        success: healthCheck.status === 'active',
        details: {
          status: healthCheck.status,
          responseTime: healthCheck.responseTime,
          version: healthCheck.version
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Service configuration test failed: ${serviceConfig.id}`, {
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Validate configuration before saving
  async validateServiceConfig(
    serviceType: ServiceType,
    config: AdapterConfig
  ): Promise<ConfigValidationResult> {
    return await serviceAdapterFactory['validator'].validateConfig(serviceType, config);
  }

  // Get configuration templates for different service types
  getServiceConfigTemplate(serviceType: ServiceType): Partial<AdapterConfig> {
    const templates: Record<ServiceType, Partial<AdapterConfig>> = {
      [ServiceType.PROXMOX]: {
        port: 8006,
        useSSL: true,
        verifySSL: true,
        authType: AuthenticationType.USERNAME_PASSWORD,
        timeout: 10000,
        maxRetries: 3
      },
      [ServiceType.DOCKER]: {
        port: 2376,
        useSSL: true,
        verifySSL: false,
        authType: AuthenticationType.CERTIFICATE,
        timeout: 5000,
        maxRetries: 2
      },
      [ServiceType.SONARR]: {
        port: 8989,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.API_KEY,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.RADARR]: {
        port: 7878,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.API_KEY,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.SABNZBD]: {
        port: 8080,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.NONE,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.QBITTORRENT]: {
        port: 8080,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.USERNAME_PASSWORD,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.DELUGE]: {
        port: 8112,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.NONE,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.JELLYFIN]: {
        port: 8096,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.API_KEY,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.PLEX]: {
        port: 32400,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.TOKEN,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.TRANSMISSION]: {
        port: 9091,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.USERNAME_PASSWORD,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.NZBGET]: {
        port: 6789,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.USERNAME_PASSWORD,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.LIDARR]: {
        port: 8686,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.API_KEY,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.BAZARR]: {
        port: 6767,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.API_KEY,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.TAUTULLI]: {
        port: 8181,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.API_KEY,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.OVERSEERR]: {
        port: 5055,
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.API_KEY,
        timeout: 5000,
        maxRetries: 3
      },
      [ServiceType.CUSTOM]: {
        useSSL: false,
        verifySSL: true,
        authType: AuthenticationType.NONE,
        timeout: 5000,
        maxRetries: 3
      }
    };

    return templates[serviceType] || templates[ServiceType.CUSTOM];
  }

  // Bulk operations
  async bulkUpdateServiceConfigs(
    configUpdates: Array<{ id: string; updates: Partial<AdapterConfig> }>
  ): Promise<ServiceConfig[]> {
    const results: ServiceConfig[] = [];

    for (const { id, updates } of configUpdates) {
      try {
        const updated = await this.updateServiceConfig(id, updates);
        results.push(updated);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Bulk update failed for config ${id}`, { error: errorMessage });
        // Continue with other updates even if one fails
      }
    }

    return results;
  }

  async bulkDeleteServiceConfigs(ids: string[]): Promise<number> {
    let deletedCount = 0;

    for (const id of ids) {
      try {
        await this.deleteServiceConfig(id);
        deletedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Bulk delete failed for config ${id}`, { error: errorMessage });
        // Continue with other deletions even if one fails
      }
    }

    return deletedCount;
  }

  // Import/Export configurations
  async exportServiceConfigs(userId: string): Promise<string> {
    const configs = await this.getUserServiceConfigs(userId);
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      userId,
      configs: configs.map(config => ({
        id: config.id,
        name: config.name,
        description: config.description,
        serviceType: config.serviceType,
        baseUrl: config.baseUrl,
        port: config.port,
        authType: config.authType,
        serviceConfig: config.serviceConfig,
        timeout: config.timeout,
        maxRetries: config.maxRetries,
        useSSL: config.useSSL,
        verifySSL: config.verifySSL,
        headers: config.headers,
        tags: config.tags
        // Note: Sensitive data like API keys, passwords are not exported
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importServiceConfigs(
    userId: string,
    importData: string,
    options: {
      overwriteExisting?: boolean;
      skipValidation?: boolean;
    } = {}
  ): Promise<{
    imported: number;
    skipped: number;
    errors: Array<{ name: string; error: string }>;
  }> {
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as Array<{ name: string; error: string }>
    };

    try {
      const data = JSON.parse(importData);

      if (!data.configs || !Array.isArray(data.configs)) {
        throw new Error('Invalid import data format');
      }

      for (const configData of data.configs) {
        try {
          // Check if configuration already exists
          if (!options.overwriteExisting) {
            const existingConfigs = await this.getServiceConfigsByType(
              configData.serviceType,
              userId
            );
            const existing = existingConfigs.find(c => c.name === configData.name);
            if (existing) {
              results.skipped++;
              continue;
            }
          }

          // Create new configuration
          const adapterConfig: AdapterConfig = {
            baseUrl: configData.baseUrl,
            port: configData.port,
            timeout: configData.timeout || 5000,
            maxRetries: configData.maxRetries || 3,
            useSSL: configData.useSSL !== false,
            verifySSL: configData.verifySSL !== false,
            headers: configData.headers || {},
            authType: configData.authType,
            serviceConfig: configData.serviceConfig || {}
          };

          // Validate configuration if not skipped
          if (!options.skipValidation) {
            const validation = await this.validateServiceConfig(
              configData.serviceType,
              adapterConfig
            );
            if (!validation.valid) {
              throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
          }

          // Create and save configuration
          const serviceConfig = await this.createServiceConfigFromAdapterConfig(
            adapterConfig,
            configData.serviceType,
            userId,
            configData.name,
            configData.description
          );

          if (configData.tags) {
            configData.tags.forEach((tag: string) => serviceConfig.addTag(tag));
          }

          await this.saveServiceConfig(serviceConfig);
          results.imported++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.errors.push({
            name: configData.name || 'Unknown',
            error: errorMessage
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Import failed: ${errorMessage}`);
    }

    return results;
  }

  // Private helper methods

  private extractBaseUrl(fullUrl: string): string {
    try {
      const url = new URL(fullUrl);
      return url.origin;
    } catch {
      return fullUrl;
    }
  }

  private async getUserById(userId: string): Promise<any> {
    // This would typically use the User repository
    // For now, return a mock user object
    return { id: userId };
  }
}