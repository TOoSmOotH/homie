import {
  AdapterFactory,
  AdapterConfig,
  ServiceDiscoveryResult,
  ConfigValidationResult,
  AdapterResponse,
  HealthCheckResult
} from '../../types/adapter.types';
import { IServiceAdapter } from '../../types/adapter.types';
import { ServiceType, ServiceStatus, AuthenticationType } from '../../models/ServiceConfig';
import { ProxmoxAdapter } from './ProxmoxAdapter';
import { DockerAdapter } from './DockerAdapter';
import { SonarrAdapter } from './SonarrAdapter';
import { RadarrAdapter } from './RadarrAdapter';
import { SabnzbdAdapter } from './SabnzbdAdapter';
import { logger } from '../../utils/logger';
import { responseFormatter } from './ResponseFormatter';
import { resilienceManager, DEFAULT_CIRCUIT_BREAKER_CONFIG, DEFAULT_RETRY_CONFIG, DEFAULT_RATE_LIMITER_CONFIG } from './ResilienceManager';

// Service adapter registry
class ServiceAdapterRegistry {
  private static instance: ServiceAdapterRegistry;
  private adapters: Map<string, IServiceAdapter> = new Map();
  private adapterClasses: Map<ServiceType, new (config: AdapterConfig) => IServiceAdapter> = new Map();

  static getInstance(): ServiceAdapterRegistry {
    if (!ServiceAdapterRegistry.instance) {
      ServiceAdapterRegistry.instance = new ServiceAdapterRegistry();
    }
    return ServiceAdapterRegistry.instance;
  }

  // Register adapter class for a service type
  registerAdapterClass(serviceType: ServiceType, adapterClass: new (config: AdapterConfig) => IServiceAdapter): void {
    this.adapterClasses.set(serviceType, adapterClass);
    logger.info(`Registered adapter class for service type: ${serviceType}`);
  }

  // Create adapter instance
  createAdapter(serviceType: ServiceType, config: AdapterConfig): IServiceAdapter {
    const adapterClass = this.adapterClasses.get(serviceType);

    if (!adapterClass) {
      throw new Error(`No adapter class registered for service type: ${serviceType}`);
    }

    try {
      const adapter = new adapterClass(config);
      const adapterId = this.generateAdapterId(serviceType, config.baseUrl);

      // Store adapter instance
      this.adapters.set(adapterId, adapter);

      logger.info(`Created adapter instance: ${adapterId}`);
      return adapter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to create adapter for ${serviceType}`, { error: errorMessage });
      throw error;
    }
  }

  // Get existing adapter instance
  getAdapter(serviceType: ServiceType, baseUrl: string): IServiceAdapter | undefined {
    const adapterId = this.generateAdapterId(serviceType, baseUrl);
    return this.adapters.get(adapterId);
  }

  // Remove adapter instance
  removeAdapter(serviceType: ServiceType, baseUrl: string): boolean {
    const adapterId = this.generateAdapterId(serviceType, baseUrl);
    const adapter = this.adapters.get(adapterId);

    if (adapter) {
      // Disconnect adapter before removing
      adapter.disconnect().catch(error => {
        logger.warn(`Error disconnecting adapter during removal: ${adapterId}`, { error: error.message });
      });

      this.adapters.delete(adapterId);
      logger.info(`Removed adapter instance: ${adapterId}`);
      return true;
    }

    return false;
  }

  // Get all registered service types
  getRegisteredServiceTypes(): ServiceType[] {
    return Array.from(this.adapterClasses.keys());
  }

  // Get all active adapter instances
  getActiveAdapters(): Map<string, IServiceAdapter> {
    return new Map(this.adapters);
  }

  // Get adapter statistics
  getAdapterStats(): {
    totalRegisteredTypes: number;
    totalActiveInstances: number;
    instancesByType: Record<string, number>;
  } {
    const instancesByType: Record<string, number> = {};

    for (const adapter of this.adapters.values()) {
      const type = adapter.serviceType;
      instancesByType[type] = (instancesByType[type] || 0) + 1;
    }

    return {
      totalRegisteredTypes: this.adapterClasses.size,
      totalActiveInstances: this.adapters.size,
      instancesByType
    };
  }

  // Cleanup idle adapters
  async cleanupIdleAdapters(maxIdleTime: number = 300000): Promise<number> { // 5 minutes default
    const now = Date.now();
    let cleanedCount = 0;

    for (const [adapterId, adapter] of this.adapters.entries()) {
      // Check if adapter hasn't been used recently
      // Note: This is a simplified check - in a real implementation,
      // you'd track last usage time per adapter
      if (adapter.connectionState.lastConnectionAttempt &&
          (now - adapter.connectionState.lastConnectionAttempt.getTime()) > maxIdleTime) {
        await this.removeAdapter(adapter.serviceType, adapter.config.baseUrl);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} idle adapter instances`);
    }

    return cleanedCount;
  }

  private generateAdapterId(serviceType: ServiceType, baseUrl: string): string {
    // Create a consistent ID based on service type and base URL
    return `${serviceType}_${Buffer.from(baseUrl).toString('base64').replace(/[/+=]/g, '_')}`;
  }
}

// Service discovery class
class ServiceDiscovery {
  private static instance: ServiceDiscovery;
  private discoveryFunctions: Map<ServiceType, (baseUrl: string) => Promise<ServiceDiscoveryResult>> = new Map();

  static getInstance(): ServiceDiscovery {
    if (!ServiceDiscovery.instance) {
      ServiceDiscovery.instance = new ServiceDiscovery();
    }
    return ServiceDiscovery.instance;
  }

  // Register discovery function for a service type
  registerDiscoveryFunction(
    serviceType: ServiceType,
    discoveryFn: (baseUrl: string) => Promise<ServiceDiscoveryResult>
  ): void {
    this.discoveryFunctions.set(serviceType, discoveryFn);
    logger.info(`Registered discovery function for service type: ${serviceType}`);
  }

  // Discover service at given URL
  async discoverService(baseUrl: string, expectedType?: ServiceType): Promise<ServiceDiscoveryResult[]> {
    const results: ServiceDiscoveryResult[] = [];

    if (expectedType) {
      // Test specific service type
      const discoveryFn = this.discoveryFunctions.get(expectedType);
      if (discoveryFn) {
        try {
          const result = await discoveryFn(baseUrl);
          results.push(result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.warn(`Discovery failed for ${expectedType} at ${baseUrl}`, { error: errorMessage });
          results.push({
            serviceType: expectedType,
            detected: false,
            confidence: 0,
            details: { error: errorMessage }
          });
        }
      }
    } else {
      // Test all registered service types
      for (const [serviceType, discoveryFn] of this.discoveryFunctions.entries()) {
        try {
          const result = await discoveryFn(baseUrl);
          results.push(result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.debug(`Discovery failed for ${serviceType} at ${baseUrl}`, { error: errorMessage });
          results.push({
            serviceType,
            detected: false,
            confidence: 0,
            details: { error: errorMessage }
          });
        }
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  // Get supported service types for discovery
  getDiscoverableServices(): ServiceType[] {
    return Array.from(this.discoveryFunctions.keys());
  }
}

// Configuration validator class
class ConfigurationValidator {
  private static instance: ConfigurationValidator;
  private validators: Map<ServiceType, (config: AdapterConfig) => Promise<ConfigValidationResult>> = new Map();

  static getInstance(): ConfigurationValidator {
    if (!ConfigurationValidator.instance) {
      ConfigurationValidator.instance = new ConfigurationValidator();
    }
    return ConfigurationValidator.instance;
  }

  // Register validator for a service type
  registerValidator(
    serviceType: ServiceType,
    validator: (config: AdapterConfig) => Promise<ConfigValidationResult>
  ): void {
    this.validators.set(serviceType, validator);
    logger.info(`Registered configuration validator for service type: ${serviceType}`);
  }

  // Validate configuration
  async validateConfig(serviceType: ServiceType, config: AdapterConfig): Promise<ConfigValidationResult> {
    const validator = this.validators.get(serviceType);

    if (!validator) {
      return {
        valid: false,
        errors: [`No validator registered for service type: ${serviceType}`],
        warnings: [],
        suggestions: ['Register a validator for this service type']
      };
    }

    try {
      return await validator(config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Configuration validation failed for ${serviceType}`, { error: errorMessage });
      return {
        valid: false,
        errors: [`Validation error: ${errorMessage}`],
        warnings: [],
        suggestions: ['Check configuration and try again']
      };
    }
  }
}

// Main service adapter factory
export class ServiceAdapterFactory implements AdapterFactory {
  private registry = ServiceAdapterRegistry.getInstance();
  private discovery = ServiceDiscovery.getInstance();
  private validator = ConfigurationValidator.getInstance();

  constructor() {
    this.initializeBuiltInAdapters();
    this.initializeBuiltInDiscovery();
    this.initializeBuiltInValidators();
  }

  // Create adapter with validation and resilience
  async createAdapter(serviceType: ServiceType, config: AdapterConfig): Promise<IServiceAdapter> {
    // Validate configuration first
    const validation = await this.validator.validateConfig(serviceType, config);
    if (!validation.valid) {
      const error = new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      logger.error('Adapter creation failed due to invalid configuration', {
        serviceType,
        errors: validation.errors,
        warnings: validation.warnings
      });
      throw error;
    }

    // Check for existing adapter
    const existingAdapter = this.registry.getAdapter(serviceType, config.baseUrl);
    if (existingAdapter) {
      logger.info(`Returning existing adapter for ${serviceType} at ${config.baseUrl}`);
      return existingAdapter;
    }

    // Create new adapter
    const adapter = this.registry.createAdapter(serviceType, config);

    // Initialize with resilience
    try {
      await adapter.initialize();
      logger.info(`Successfully created and initialized adapter for ${serviceType}`);
      return adapter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize adapter for ${serviceType}`, { error: errorMessage });
      throw error;
    }
  }

  // Create adapter with automatic service discovery
  async createAdapterWithDiscovery(
    baseUrl: string,
    config: Partial<AdapterConfig> = {}
  ): Promise<{ adapter: IServiceAdapter; discoveryResult: ServiceDiscoveryResult }> {
    // Discover service type
    const discoveryResults = await this.discovery.discoverService(baseUrl);

    if (discoveryResults.length === 0 || !discoveryResults[0].detected) {
      throw new Error(`No service detected at ${baseUrl}`);
    }

    const bestMatch = discoveryResults[0];
    logger.info(`Discovered ${bestMatch.serviceType} service at ${baseUrl} with ${bestMatch.confidence}% confidence`);

    // Merge discovered config with provided config
    const fullConfig: AdapterConfig = {
      ...config,
      baseUrl,
      authType: config.authType || AuthenticationType.API_KEY
    };

    // Create adapter
    const adapter = await this.createAdapter(bestMatch.serviceType, fullConfig);

    return { adapter, discoveryResult: bestMatch };
  }

  // Get supported services
  getSupportedServices(): ServiceType[] {
    return this.registry.getRegisteredServiceTypes();
  }

  // Get factory statistics
  getFactoryStats(): {
    registry: ReturnType<typeof ServiceAdapterRegistry.prototype.getAdapterStats>;
    discoverableServices: ServiceType[];
    validatableServices: ServiceType[];
  } {
    return {
      registry: this.registry.getAdapterStats(),
      discoverableServices: this.discovery.getDiscoverableServices(),
      validatableServices: Array.from(this.validator['validators'].keys())
    };
  }

  // Cleanup resources
  async cleanup(): Promise<void> {
    const cleaned = await this.registry.cleanupIdleAdapters();
    logger.info(`Factory cleanup completed, removed ${cleaned} idle adapters`);
  }

  // Private initialization methods

  private initializeBuiltInAdapters(): void {
    // Register Proxmox adapter
    this.registry.registerAdapterClass(ServiceType.PROXMOX, ProxmoxAdapter);

    // Register new adapters
    this.registry.registerAdapterClass(ServiceType.DOCKER, DockerAdapter);
    this.registry.registerAdapterClass(ServiceType.SONARR, SonarrAdapter);
    this.registry.registerAdapterClass(ServiceType.RADARR, RadarrAdapter);
    this.registry.registerAdapterClass(ServiceType.SABNZBD, SabnzbdAdapter);

    logger.info('Initialized built-in adapter classes');
  }

  private initializeBuiltInDiscovery(): void {
    // Register Proxmox discovery function
    this.discovery.registerDiscoveryFunction(ServiceType.PROXMOX, this.discoverProxmoxService);

    // Register new discovery functions
    this.discovery.registerDiscoveryFunction(ServiceType.DOCKER, this.discoverDockerService);
    this.discovery.registerDiscoveryFunction(ServiceType.SONARR, this.discoverSonarrService);
    this.discovery.registerDiscoveryFunction(ServiceType.RADARR, this.discoverRadarrService);
    this.discovery.registerDiscoveryFunction(ServiceType.SABNZBD, this.discoverSabnzbdService);

    logger.info('Initialized built-in discovery functions');
  }

  private initializeBuiltInValidators(): void {
    // Register Proxmox configuration validator
    this.validator.registerValidator(ServiceType.PROXMOX, this.validateProxmoxConfig);

    // Register new validators
    this.validator.registerValidator(ServiceType.DOCKER, this.validateDockerConfig);
    this.validator.registerValidator(ServiceType.SONARR, this.validateSonarrConfig);
    this.validator.registerValidator(ServiceType.RADARR, this.validateRadarrConfig);
    this.validator.registerValidator(ServiceType.SABNZBD, this.validateSabnzbdConfig);

    logger.info('Initialized built-in configuration validators');
  }

  // Built-in discovery functions

  private async discoverProxmoxService(baseUrl: string): Promise<ServiceDiscoveryResult> {
    try {
      // Try to access Proxmox API version endpoint
      const response = await fetch(`${baseUrl}/api2/json/version`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json() as { data?: { version?: string; [key: string]: any } };
        if (data.data && data.data.version) {
          return {
            serviceType: ServiceType.PROXMOX,
            detected: true,
            confidence: 0.9,
            version: data.data.version,
            details: data.data
          };
        }
      }

      return {
        serviceType: ServiceType.PROXMOX,
        detected: false,
        confidence: 0,
        details: { httpStatus: response.status }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        serviceType: ServiceType.PROXMOX,
        detected: false,
        confidence: 0,
        details: { error: errorMessage }
      };
    }
  }

  // Built-in discovery functions

  private async discoverDockerService(baseUrl: string): Promise<ServiceDiscoveryResult> {
    try {
      const response = await fetch(`${baseUrl}/version`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json() as { Version?: string; ApiVersion?: string; [key: string]: any };
        if (data.Version || data.ApiVersion) {
          return {
            serviceType: ServiceType.DOCKER,
            detected: true,
            confidence: 0.9,
            version: data.Version || data.ApiVersion,
            details: data
          };
        }
      }

      return {
        serviceType: ServiceType.DOCKER,
        detected: false,
        confidence: 0,
        details: { httpStatus: response.status }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        serviceType: ServiceType.DOCKER,
        detected: false,
        confidence: 0,
        details: { error: errorMessage }
      };
    }
  }

  private async discoverSonarrService(baseUrl: string): Promise<ServiceDiscoveryResult> {
    try {
      const response = await fetch(`${baseUrl}/api/system/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': 'test' // Will likely fail but should return proper error
        },
        signal: AbortSignal.timeout(5000)
      });

      if (response.status === 401 || response.status === 403) {
        // Expected auth error, but indicates Sonarr is present
        return {
          serviceType: ServiceType.SONARR,
          detected: true,
          confidence: 0.8,
          details: { httpStatus: response.status }
        };
      }

      return {
        serviceType: ServiceType.SONARR,
        detected: false,
        confidence: 0,
        details: { httpStatus: response.status }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        serviceType: ServiceType.SONARR,
        detected: false,
        confidence: 0,
        details: { error: errorMessage }
      };
    }
  }

  private async discoverRadarrService(baseUrl: string): Promise<ServiceDiscoveryResult> {
    try {
      const response = await fetch(`${baseUrl}/api/system/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': 'test' // Will likely fail but should return proper error
        },
        signal: AbortSignal.timeout(5000)
      });

      if (response.status === 401 || response.status === 403) {
        // Expected auth error, but indicates Radarr is present
        return {
          serviceType: ServiceType.RADARR,
          detected: true,
          confidence: 0.8,
          details: { httpStatus: response.status }
        };
      }

      return {
        serviceType: ServiceType.RADARR,
        detected: false,
        confidence: 0,
        details: { httpStatus: response.status }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        serviceType: ServiceType.RADARR,
        detected: false,
        confidence: 0,
        details: { error: errorMessage }
      };
    }
  }

  private async discoverSabnzbdService(baseUrl: string): Promise<ServiceDiscoveryResult> {
    try {
      const response = await fetch(`${baseUrl}/api`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json() as { version?: string; [key: string]: any };
        if (data.version) {
          return {
            serviceType: ServiceType.SABNZBD,
            detected: true,
            confidence: 0.9,
            version: data.version,
            details: data
          };
        }
      }

      return {
        serviceType: ServiceType.SABNZBD,
        detected: false,
        confidence: 0,
        details: { httpStatus: response.status }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        serviceType: ServiceType.SABNZBD,
        detected: false,
        confidence: 0,
        details: { error: errorMessage }
      };
    }
  }

  // Built-in validation functions

  private async validateProxmoxConfig(config: AdapterConfig): Promise<ConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required fields
    if (!config.baseUrl) {
      errors.push('Base URL is required');
    }

    if (!config.username) {
      errors.push('Username is required for Proxmox authentication');
    }

    if (!config.password) {
      errors.push('Password is required for Proxmox authentication');
    }

    // Port validation
    if (config.port && config.port !== 8006) {
      warnings.push('Non-standard Proxmox port detected. Default is 8006');
    }

    // SSL validation
    if (!config.verifySSL) {
      warnings.push('SSL verification is disabled. This may pose security risks');
      suggestions.push('Enable SSL verification in production environments');
    }

    // Timeout validation
    if (config.timeout && config.timeout < 5000) {
      warnings.push('Timeout may be too short for Proxmox API calls');
      suggestions.push('Consider using at least 5000ms timeout');
    }

    // Authentication type validation
    if (config.authType !== 'username_password') {
      errors.push('Proxmox requires username/password authentication');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private async validateDockerConfig(config: AdapterConfig): Promise<ConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required fields
    if (!config.baseUrl) {
      errors.push('Base URL is required');
    }

    // Port validation - Docker typically uses 2376 (TLS) or 2375 (no TLS)
    if (config.port && config.port !== 2376 && config.port !== 2375) {
      warnings.push('Non-standard Docker port detected. Common ports are 2375 (no TLS) or 2376 (TLS)');
    }

    // SSL validation
    if (config.useSSL && !config.verifySSL) {
      warnings.push('SSL verification is disabled. This may pose security risks');
      suggestions.push('Enable SSL verification in production environments');
    }

    // Authentication type validation
    if (config.authType === 'none') {
      warnings.push('No authentication configured for Docker');
      suggestions.push('Consider using API key or username/password authentication');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private async validateSonarrConfig(config: AdapterConfig): Promise<ConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required fields
    if (!config.baseUrl) {
      errors.push('Base URL is required');
    }

    if (!config.apiKey) {
      errors.push('API key is required for Sonarr authentication');
    }

    // Port validation
    if (config.port && config.port !== 8989) {
      warnings.push('Non-standard Sonarr port detected. Default is 8989');
    }

    // Authentication type validation
    if (config.authType !== 'api_key') {
      errors.push('Sonarr requires API key authentication');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private async validateRadarrConfig(config: AdapterConfig): Promise<ConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required fields
    if (!config.baseUrl) {
      errors.push('Base URL is required');
    }

    if (!config.apiKey) {
      errors.push('API key is required for Radarr authentication');
    }

    // Port validation
    if (config.port && config.port !== 7878) {
      warnings.push('Non-standard Radarr port detected. Default is 7878');
    }

    // Authentication type validation
    if (config.authType !== 'api_key') {
      errors.push('Radarr requires API key authentication');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private async validateSabnzbdConfig(config: AdapterConfig): Promise<ConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required fields
    if (!config.baseUrl) {
      errors.push('Base URL is required');
    }

    if (!config.apiKey) {
      errors.push('API key is required for SABnzbd authentication');
    }

    // Port validation
    if (config.port && config.port !== 8080) {
      warnings.push('Non-standard SABnzbd port detected. Default is 8080');
    }

    // Authentication type validation
    if (config.authType !== 'api_key') {
      errors.push('SABnzbd requires API key authentication');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }
}

// Export singleton instance
export const serviceAdapterFactory = new ServiceAdapterFactory();

// Export utility functions
export function getAdapter(serviceType: ServiceType, baseUrl: string): IServiceAdapter | undefined {
  return ServiceAdapterRegistry.getInstance().getAdapter(serviceType, baseUrl);
}

export function removeAdapter(serviceType: ServiceType, baseUrl: string): boolean {
  return ServiceAdapterRegistry.getInstance().removeAdapter(serviceType, baseUrl);
}

export async function cleanupIdleAdapters(maxIdleTime?: number): Promise<number> {
  return ServiceAdapterRegistry.getInstance().cleanupIdleAdapters(maxIdleTime);
}