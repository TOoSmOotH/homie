import { BaseServiceAdapter } from '../../../../src/services/adapters/BaseServiceAdapter';
import { AdapterConfig, AdapterResponse } from '../../../../src/types/adapter.types';
import { ServiceType, AuthenticationType } from '../../../../src/models/ServiceConfig';

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Create a concrete implementation of BaseServiceAdapter for testing
class TestServiceAdapter extends BaseServiceAdapter {
  readonly serviceType = ServiceType.CUSTOM;

  async healthCheck(): Promise<any> {
    return this.get('/health');
  }

  // Expose protected methods for testing
  public testBuildUrl(endpoint: string, params?: Record<string, any>): string {
    return this.buildUrl(endpoint, params);
  }

  public testGetAuthHeaders(): Record<string, string> {
    return this.getAuthHeaders();
  }

  public testHandleError(error: any, context?: string): any {
    return this.handleError(error, context);
  }
}

describe('BaseServiceAdapter', () => {
  let adapter: TestServiceAdapter;
  let config: AdapterConfig;

  beforeEach(() => {
    // Mock axios.create to return a mock object
    axios.create = jest.fn().mockReturnValue({
      interceptors: {
        request: { use: jest.fn(), clear: jest.fn() },
        response: { use: jest.fn(), clear: jest.fn() }
      },
      defaults: {}
    });

    config = {
      baseUrl: 'https://api.example.com',
      port: 443,
      useSSL: true,
      verifySSL: true,
      authType: AuthenticationType.API_KEY,
      apiKey: 'test-api-key',
      timeout: 5000,
      maxRetries: 3
    };

    adapter = new TestServiceAdapter(ServiceType.CUSTOM, config);
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', async () => {
      await adapter.initialize();

      expect(adapter.config.baseUrl).toBe(config.baseUrl);
      expect(adapter.config.authType).toBe(config.authType);
      expect(adapter.connectionState.isConnected).toBe(false);
    });

    it('should validate configuration on initialization', async () => {
      const invalidConfig = { ...config, baseUrl: '' };
      const invalidAdapter = new TestServiceAdapter(ServiceType.CUSTOM, invalidConfig);

      await expect(invalidAdapter.initialize()).rejects.toThrow('Configuration validation failed');
    });
  });

  describe('URL building', () => {
    it('should build URL without parameters', () => {
      const url = adapter.testBuildUrl('/api/v1/users');
      expect(url).toBe('https://api.example.com/api/v1/users');
    });

    it('should build URL with query parameters', () => {
      const url = adapter.testBuildUrl('/api/v1/users', { page: 1, limit: 10 });
      expect(url).toBe('https://api.example.com/api/v1/users?page=1&limit=10');
    });

    it('should handle URL with existing query parameters', () => {
      const url = adapter.testBuildUrl('/api/v1/users?sort=name', { page: 1 });
      expect(url).toBe('https://api.example.com/api/v1/users?sort=name&page=1');
    });
  });

  describe('authentication headers', () => {
    it('should generate API key headers', () => {
      const headers = adapter.testGetAuthHeaders();
      expect(headers['X-Api-Key']).toBe('test-api-key');
    });

    it('should generate Bearer token headers', () => {
      const tokenConfig = { ...config, authType: AuthenticationType.TOKEN, token: 'test-token' };
      const tokenAdapter = new TestServiceAdapter(ServiceType.CUSTOM, tokenConfig);
      const headers = tokenAdapter.testGetAuthHeaders();
      expect(headers['Authorization']).toBe('Bearer test-token');
    });

    it('should generate Basic auth headers', () => {
      const basicConfig = {
        ...config,
        authType: AuthenticationType.USERNAME_PASSWORD,
        username: 'testuser',
        password: 'testpass'
      };
      const basicAdapter = new TestServiceAdapter(ServiceType.CUSTOM, basicConfig);
      const headers = basicAdapter.testGetAuthHeaders();
      expect(headers['Authorization']).toMatch(/^Basic /);
    });

    it('should include custom headers', () => {
      const customHeadersConfig = {
        ...config,
        headers: { 'Custom-Header': 'custom-value' }
      };
      const customAdapter = new TestServiceAdapter(ServiceType.CUSTOM, customHeadersConfig);
      const headers = customAdapter.testGetAuthHeaders();
      expect(headers['Custom-Header']).toBe('custom-value');
    });
  });

  describe('HTTP client setup', () => {
    it('should create axios instance with correct configuration', async () => {
      await adapter.initialize();

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: expect.any(Object)
      });
    });

    it('should setup request and response interceptors', async () => {
      await adapter.initialize();

      const mockHttpClient = adapter['httpClient'];
      expect(mockHttpClient.interceptors.request.use).toHaveBeenCalled();
      expect(mockHttpClient.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle axios errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Something went wrong' }
        }
      };

      const error = adapter.testHandleError(axiosError, 'test operation');

      expect(error.code).toBe('HTTP_500');
      expect(error.message).toBe('Internal Server Error');
      expect(error.httpStatus).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it('should handle network errors', () => {
      const networkError = {
        isAxiosError: true,
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND api.example.com'
      };

      const error = adapter.testHandleError(networkError, 'test operation');

      expect(error.code).toBe('ENOTFOUND');
      expect(error.retryable).toBe(true);
    });

    it('should handle timeout errors', () => {
      const timeoutError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      };

      const error = adapter.testHandleError(timeoutError, 'test operation');

      expect(error.retryable).toBe(true);
    });

    it('should handle generic errors', () => {
      const genericError = new Error('Something unexpected happened');

      const error = adapter.testHandleError(genericError, 'test operation');

      expect(error.message).toBe('Something unexpected happened');
      expect(error.retryable).toBe(false);
    });
  });

  describe('configuration updates', () => {
    it('should update configuration successfully', async () => {
      await adapter.initialize();

      const newConfig = {
        timeout: 10000,
        maxRetries: 5,
        headers: { 'X-Custom': 'value' }
      };

      await adapter.updateConfig(newConfig);

      expect(adapter.config.timeout).toBe(10000);
      expect(adapter.config.maxRetries).toBe(5);
      expect(adapter.config.headers?.['X-Custom']).toBe('value');
    });

    it('should validate new configuration', async () => {
      await adapter.initialize();

      const invalidConfig = { baseUrl: '' };

      await expect(adapter.updateConfig(invalidConfig)).rejects.toThrow('Configuration validation failed');
    });
  });

  describe('connection management', () => {
    it('should initialize connection state', async () => {
      await adapter.initialize();

      expect(adapter.connectionState.isConnected).toBe(false);
      expect(adapter.connectionState.retryCount).toBe(0);
      expect(adapter.connectionState.maxRetries).toBe(3);
    });

    it('should disconnect successfully', async () => {
      await adapter.initialize();
      adapter.connectionState.isConnected = true;

      await adapter.disconnect();

      expect(adapter.connectionState.isConnected).toBe(false);
      expect(adapter.connectionState.connectionError).toBeUndefined();
    });
  });
});