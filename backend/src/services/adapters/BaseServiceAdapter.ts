import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  IServiceAdapter,
  AdapterConfig,
  AdapterResponse,
  AdapterError,
  HealthCheckResult,
  ConnectionState
} from '../../types/adapter.types';
import { ServiceType, AuthenticationType, ServiceStatus } from '../../models/ServiceConfig';
import { logger } from '../../utils/logger';

// Base implementation of the service adapter interface
export abstract class BaseServiceAdapter implements IServiceAdapter {
  protected httpClient: AxiosInstance;
  protected _config: AdapterConfig;
  protected _connectionState: ConnectionState;
  protected _serviceType: ServiceType;
  protected initialized: boolean = false;

  constructor(serviceType: ServiceType, config: AdapterConfig) {
    this._serviceType = serviceType;
    this._config = { ...config };
    this._connectionState = {
      isConnected: false,
      retryCount: 0,
      maxRetries: config.maxRetries || 3
    };

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.buildBaseUrl(),
      timeout: config.timeout || 5000,
      headers: this.getDefaultHeaders()
    });

    // Configure axios interceptors
    this.setupInterceptors();
  }

  // Abstract properties and methods that must be implemented by subclasses
  abstract readonly serviceType: ServiceType;
  abstract healthCheck(): Promise<HealthCheckResult>;

  // Getter for config
  get config(): AdapterConfig {
    return { ...this._config };
  }

  // Getter/setter for connection state
  get connectionState(): ConnectionState {
    return { ...this._connectionState };
  }

  set connectionState(state: ConnectionState) {
    this._connectionState = { ...state };
  }

  // Initialize the adapter
  async initialize(): Promise<void> {
    try {
      logger.info(`Initializing ${this._serviceType} adapter`, {
        baseUrl: this._config.baseUrl,
        serviceType: this._serviceType
      });

      await this.validateConfig();
      this.setupInterceptors();
      this.initialized = true;

      logger.info(`${this._serviceType} adapter initialized successfully`);
    } catch (error) {
      logger.error(`Failed to initialize ${this._serviceType} adapter`, {
        error: this.handleError(error, 'initialization')
      });
      throw error;
    }
  }

  // Connect to the service
  async connect(): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.info(`Attempting to connect to ${this._serviceType} service`, {
        baseUrl: this._config.baseUrl,
        attempt: this._connectionState.retryCount + 1
      });

      const healthResult = await this.healthCheck();

      this._connectionState.isConnected = healthResult.status === ServiceStatus.ACTIVE;
      this._connectionState.lastConnectionAttempt = new Date();

      if (this._connectionState.isConnected) {
        this._connectionState.retryCount = 0;
        this._connectionState.connectionError = undefined;
        logger.info(`${this._serviceType} service connected successfully`);
      } else {
        this._connectionState.connectionError = healthResult.errorMessage;
        logger.warn(`${this._serviceType} service connection failed`, {
          status: healthResult.status,
          error: healthResult.errorMessage
        });
      }

      return this._connectionState.isConnected;
    } catch (error) {
      this._connectionState.retryCount++;
      this._connectionState.connectionError = this.handleError(error, 'connection').message;
      this._connectionState.lastConnectionAttempt = new Date();

      logger.error(`Failed to connect to ${this._serviceType} service`, {
        error: this._connectionState.connectionError,
        retryCount: this._connectionState.retryCount
      });

      // Check if we should retry
      if (this._connectionState.retryCount < this._connectionState.maxRetries) {
        logger.info(`Retrying ${this._serviceType} connection in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.connect();
      }

      return false;
    }
  }

  // Disconnect from the service
  async disconnect(): Promise<void> {
    try {
      logger.info(`Disconnecting from ${this._serviceType} service`);

      if (this.httpClient) {
        this.httpClient.interceptors.request.clear();
        this.httpClient.interceptors.response.clear();
      }

      this._connectionState.isConnected = false;
      this._connectionState.connectionError = undefined;

      logger.info(`${this._serviceType} service disconnected successfully`);
    } catch (error) {
      logger.error(`Error disconnecting from ${this._serviceType} service`, {
        error: this.handleError(error, 'disconnection')
      });
    }
  }

  // Generic HTTP GET method
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<AdapterResponse<T>> {
    return this.makeRequest<T>('GET', endpoint, undefined, params);
  }

  // Generic HTTP POST method
  async post<T = any>(endpoint: string, data?: any, params?: Record<string, any>): Promise<AdapterResponse<T>> {
    return this.makeRequest<T>('POST', endpoint, data, params);
  }

  // Generic HTTP PUT method
  async put<T = any>(endpoint: string, data?: any, params?: Record<string, any>): Promise<AdapterResponse<T>> {
    return this.makeRequest<T>('PUT', endpoint, data, params);
  }

  // Generic HTTP PATCH method
  async patch<T = any>(endpoint: string, data?: any, params?: Record<string, any>): Promise<AdapterResponse<T>> {
    return this.makeRequest<T>('PATCH', endpoint, data, params);
  }

  // Generic HTTP DELETE method
  async delete<T = any>(endpoint: string, params?: Record<string, any>): Promise<AdapterResponse<T>> {
    return this.makeRequest<T>('DELETE', endpoint, undefined, params);
  }

  // Update adapter configuration
  async updateConfig(newConfig: Partial<AdapterConfig>): Promise<void> {
    const oldConfig = { ...this._config };

    try {
      this._config = { ...this._config, ...newConfig };

      // Reinitialize HTTP client if base URL or other critical config changed
      if (newConfig.baseUrl || newConfig.port || newConfig.useSSL !== undefined) {
        this.httpClient.defaults.baseURL = this.buildBaseUrl();
      }

      // Update timeout if changed
      if (newConfig.timeout) {
        this.httpClient.defaults.timeout = newConfig.timeout;
      }

      // Re-setup interceptors to apply new auth headers
      this.setupInterceptors();

      // Validate new configuration
      await this.validateConfig();

      // If connected, test the connection with new config
      if (this._connectionState.isConnected) {
        const isStillConnected = await this.connect();
        if (!isStillConnected) {
          logger.warn(`${this._serviceType} configuration updated but connection test failed`);
        }
      }

      logger.info(`${this._serviceType} adapter configuration updated successfully`);
    } catch (error) {
      // Rollback configuration on error
      this._config = oldConfig;
      logger.error(`Failed to update ${this._serviceType} adapter configuration`, {
        error: this.handleError(error, 'config_update')
      });
      throw error;
    }
  }

  // Validate configuration
  async validateConfig(): Promise<boolean> {
    const errors: string[] = [];

    if (!this._config.baseUrl) {
      errors.push('Base URL is required');
    }

    if (this._config.timeout && this._config.timeout < 1000) {
      errors.push('Timeout must be at least 1000ms');
    }

    if (this._config.maxRetries && this._config.maxRetries < 0) {
      errors.push('Max retries cannot be negative');
    }

    // Service-specific validation
    await this.validateServiceSpecificConfig(errors);

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  // Build full URL for requests
  buildUrl(endpoint: string, params?: Record<string, any>): string {
    const baseUrl = this.buildBaseUrl();
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      return `${baseUrl}${url}?${queryString}`;
    }

    return `${baseUrl}${url}`;
  }

  // Get authentication headers
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (this._config.authType) {
      case AuthenticationType.API_KEY:
        if (this._config.apiKey) {
          headers['X-Api-Key'] = this._config.apiKey;
        }
        break;
      case AuthenticationType.TOKEN:
        if (this._config.token) {
          headers['Authorization'] = `Bearer ${this._config.token}`;
        }
        break;
      case AuthenticationType.USERNAME_PASSWORD:
        if (this._config.username && this._config.password) {
          const credentials = Buffer.from(`${this._config.username}:${this._config.password}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
      case AuthenticationType.CERTIFICATE:
        // Certificate-based auth would be handled at the HTTP client level
        break;
    }

    return headers;
  }

  // Handle and standardize errors
  handleError(error: any, context?: string): AdapterError {
    if (error.isAxiosError) {
      const axiosError = error as AxiosError;
      return {
        code: `HTTP_${axiosError.response?.status || 'UNKNOWN'}`,
        message: axiosError.response?.statusText || axiosError.message,
        details: axiosError.response?.data,
        httpStatus: axiosError.response?.status,
        retryable: this.isRetryableError(axiosError),
        originalError: axiosError
      };
    }

    if (error instanceof Error) {
      return {
        code: 'INTERNAL_ERROR',
        message: error.message,
        details: error.stack,
        originalError: error
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: error,
      originalError: new Error(String(error))
    };
  }

  // Protected methods for subclasses to override

  protected async validateServiceSpecificConfig(errors: string[]): Promise<void> {
    // Default implementation - services can override for specific validation
  }

  protected getServiceSpecificHeaders(): Record<string, string> {
    // Default implementation - services can override for specific headers
    return {};
  }

  // Private methods

  private buildBaseUrl(): string {
    const protocol = this._config.useSSL ? 'https' : 'http';
    const port = this._config.port ? `:${this._config.port}` : '';
    return `${protocol}://${this._config.baseUrl}${port}`;
  }

  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Homie-Service-Adapter/1.0'
    };

    // Add custom headers from config
    if (this._config.headers) {
      Object.assign(headers, this._config.headers);
    }

    // Add service-specific headers
    Object.assign(headers, this.getServiceSpecificHeaders());

    return headers;
  }

  private setupInterceptors(): void {
    // Clear existing interceptors
    this.httpClient.interceptors.request.clear();
    this.httpClient.interceptors.response.clear();

    // Request interceptor for authentication
    this.httpClient.interceptors.request.use(
      (config) => {
        const authHeaders = this.getAuthHeaders();
        // Properly set headers using axios API
        Object.entries(authHeaders).forEach(([key, value]) => {
          config.headers.set(key, value);
        });
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (this.isRetryableError(error) && this._connectionState.retryCount < this._connectionState.maxRetries) {
          this._connectionState.retryCount++;
          logger.warn(`Retrying request to ${this._serviceType} service`, {
            retryCount: this._connectionState.retryCount,
            maxRetries: this._connectionState.maxRetries
          });

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * this._connectionState.retryCount));
          return this.httpClient.request(error.config);
        }

        return Promise.reject(error);
      }
    );
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<AdapterResponse<T>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this._connectionState.isConnected) {
        await this.connect();
      }

      logger.debug(`Making ${method} request to ${this._serviceType}`, {
        endpoint,
        requestId,
        hasData: !!data,
        hasParams: !!params
      });

      const response = await this.httpClient.request<T>({
        method: method as any,
        url: endpoint,
        data,
        params
      });

      const responseTime = Date.now() - startTime;

      logger.debug(`${method} request successful`, {
        endpoint,
        requestId,
        responseTime,
        status: response.status
      });

      return {
        success: true,
        data: response.data,
        metadata: {
          responseTime,
          requestId,
          timestamp: new Date().toISOString(),
          serviceVersion: this.extractServiceVersion(response),
          endpoint
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const adapterError = this.handleError(error, `${method}_${endpoint}`);

      logger.error(`${method} request failed`, {
        endpoint,
        requestId,
        responseTime,
        error: adapterError
      });

      return {
        success: false,
        error: adapterError,
        metadata: {
          responseTime,
          requestId,
          timestamp: new Date().toISOString(),
          endpoint
        }
      };
    }
  }

  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) {
      // Network errors are retryable
      return true;
    }

    const status = error.response.status;
    // Retry on server errors, but not on client errors
    return status >= 500 || status === 429;
  }

  private generateRequestId(): string {
    return `${this._serviceType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractServiceVersion(response: AxiosResponse): string | undefined {
    // Try to extract version from response headers
    const versionHeader = response.headers['x-api-version'] || response.headers['x-service-version'];
    return versionHeader || undefined;
  }
}