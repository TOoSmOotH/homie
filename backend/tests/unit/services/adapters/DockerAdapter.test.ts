import { DockerAdapter } from '../../../../src/services/adapters/DockerAdapter';
import { AdapterConfig, AdapterResponse, HealthCheckResult } from '../../../../src/types/adapter.types';
import { ServiceType, AuthenticationType, ServiceStatus } from '../../../../src/models/ServiceConfig';

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('DockerAdapter', () => {
  let adapter: DockerAdapter;
  let config: AdapterConfig;

  beforeEach(() => {
    // Mock axios.create to return a mock object
    const mockHttpClient = {
      interceptors: {
        request: { use: jest.fn(), clear: jest.fn() },
        response: { use: jest.fn(), clear: jest.fn() }
      },
      defaults: {},
      request: jest.fn()
    };

    axios.create = jest.fn().mockReturnValue(mockHttpClient);

    config = {
      baseUrl: 'https://docker.example.com',
      port: 2376,
      useSSL: true,
      verifySSL: false,
      authType: AuthenticationType.API_KEY,
      apiKey: 'test-api-key',
      timeout: 5000,
      maxRetries: 3
    };

    adapter = new DockerAdapter(config);
  });

  describe('initialization', () => {
    it('should initialize with correct service type', async () => {
      await adapter.initialize();
      expect(adapter.serviceType).toBe(ServiceType.DOCKER);
    });

    it('should validate Docker-specific configuration', async () => {
      const invalidConfig = { ...config, apiKey: undefined };
      const invalidAdapter = new DockerAdapter(invalidConfig);

      await expect(invalidAdapter.initialize()).rejects.toThrow();
    });
  });

  describe('health check', () => {
    it('should return healthy status when Docker is accessible', async () => {
      const mockResponse = {
        success: true,
        data: {
          Version: '20.10.12',
          ApiVersion: '1.41'
        }
      };

      // Mock the makeDockerRequest method
      jest.spyOn(adapter as any, 'makeDockerRequest').mockResolvedValue(mockResponse);

      const result = await adapter.healthCheck();

      expect(result.status).toBe(ServiceStatus.ACTIVE);
      expect(result.version).toBe('20.10.12');
      expect(result.details).toHaveProperty('dockerVersion');
    });

    it('should return error status when Docker is not accessible', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Connection failed' }
      };

      jest.spyOn(adapter as any, 'makeDockerRequest').mockResolvedValue(mockResponse);

      const result = await adapter.healthCheck();

      expect(result.status).toBe(ServiceStatus.ERROR);
      expect(result.errorMessage).toBe('Health check failed');
    });
  });

  describe('container operations', () => {
    const mockContainer = {
      Id: 'abc123',
      Names: ['/test-container'],
      Image: 'nginx:latest',
      State: 'running',
      Status: 'Up 2 hours'
    };

    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should list containers', async () => {
      const mockResponse = {
        success: true,
        data: [mockContainer]
      };

      jest.spyOn(adapter as any, 'makeDockerRequest').mockResolvedValue(mockResponse);

      const result = await adapter.listContainers();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockContainer]);
    });

    it('should get container by ID', async () => {
      const mockResponse = {
        success: true,
        data: mockContainer
      };

      jest.spyOn(adapter as any, 'makeDockerRequest').mockResolvedValue(mockResponse);

      const result = await adapter.getContainer('abc123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockContainer);
    });

    it('should create container', async () => {
      const createOptions = {
        Image: 'nginx:latest',
        name: 'test-container'
      };

      const mockResponse = {
        success: true,
        data: { Id: 'new-container-id', Warnings: [] }
      };

      jest.spyOn(adapter as any, 'makeDockerRequest').mockResolvedValue(mockResponse);

      const result = await adapter.createContainer(createOptions);

      expect(result.success).toBe(true);
      expect(result.data?.Id).toBe('new-container-id');
    });

    it('should start container', async () => {
      const mockResponse = {
        success: true,
        data: undefined
      };

      jest.spyOn(adapter as any, 'makeDockerRequest').mockResolvedValue(mockResponse);

      const result = await adapter.startContainer('abc123');

      expect(result.success).toBe(true);
    });

    it('should stop container', async () => {
      const mockResponse = {
        success: true,
        data: undefined
      };

      jest.spyOn(adapter as any, 'makeDockerRequest').mockResolvedValue(mockResponse);

      const result = await adapter.stopContainer('abc123', 30);

      expect(result.success).toBe(true);
    });

    it('should remove container', async () => {
      const mockResponse = {
        success: true,
        data: undefined
      };

      jest.spyOn(adapter as any, 'makeDockerRequest').mockResolvedValue(mockResponse);

      const result = await adapter.removeContainer('abc123', false, true);

      expect(result.success).toBe(true);
    });
  });

  describe('image operations', () => {
    const mockImage = {
      Id: 'sha256:abc123',
      RepoTags: ['nginx:latest'],
      Size: 1000000,
      Created: 1234567890
    };

    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should list images', async () => {
      const mockResponse = {
        success: true,
        data: [mockImage]
      };

      jest.spyOn(adapter as any, 'makeDockerRequest').mockResolvedValue(mockResponse);

      const result = await adapter.listImages();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockImage]);
    });

    it('should pull image', async () => {
      const mockResponse = {
        success: true,
        data: 'Pull complete'
      };

      jest.spyOn(adapter as any, 'makeDockerRequest').mockResolvedValue(mockResponse);

      const result = await adapter.pullImage('nginx', 'latest');

      expect(result.success).toBe(true);
    });

    it('should remove image', async () => {
      const mockResponse = {
        success: true,
        data: [{ Deleted: 'sha256:abc123' }]
      };

      jest.spyOn(adapter as any, 'makeDockerRequest').mockResolvedValue(mockResponse);

      const result = await adapter.removeImage('sha256:abc123', false, false);

      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should handle Docker-specific errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Container not found' }
        }
      };

      const error = adapter.handleError(axiosError, 'test operation');

      expect(error.code).toBe('DOCKER_NOT_FOUND');
      expect(error.message).toBe('Resource not found');
    });

    it('should handle conflict errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 409,
          statusText: 'Conflict',
          data: { message: 'Container already exists' }
        }
      };

      const error = adapter.handleError(axiosError, 'test operation');

      expect(error.code).toBe('DOCKER_CONFLICT');
      expect(error.message).toBe('Resource conflict');
    });
  });

  describe('URL building', () => {
    it('should build Docker API URLs with version', () => {
      const url = (adapter as any).buildDockerUrl('/containers/json');
      expect(url).toBe('https://docker.example.com:2376/v1.43/containers/json');
    });

    it('should use custom Docker version', () => {
      const customConfig = { ...config, serviceConfig: { dockerVersion: 'v1.40' } };
      const customAdapter = new DockerAdapter(customConfig);
      const url = (customAdapter as any).buildDockerUrl('/version');
      expect(url).toBe('https://docker.example.com:2376/v1.40/version');
    });
  });
});