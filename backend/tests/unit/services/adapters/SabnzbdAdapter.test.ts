import { SabnzbdAdapter } from '../../../../src/services/adapters/SabnzbdAdapter';
import { AdapterConfig, AdapterResponse, HealthCheckResult } from '../../../../src/types/adapter.types';
import { ServiceType, AuthenticationType, ServiceStatus } from '../../../../src/models/ServiceConfig';

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('SabnzbdAdapter', () => {
  let adapter: SabnzbdAdapter;
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
      baseUrl: 'https://sabnzbd.example.com',
      port: 8080,
      useSSL: true,
      verifySSL: true,
      authType: AuthenticationType.API_KEY,
      apiKey: 'test-sabnzbd-api-key',
      timeout: 5000,
      maxRetries: 3
    };

    adapter = new SabnzbdAdapter(config);
  });

  describe('initialization', () => {
    it('should initialize with correct service type', async () => {
      await adapter.initialize();
      expect(adapter.serviceType).toBe(ServiceType.SABNZBD);
    });

    it('should validate Sabnzbd-specific configuration', async () => {
      const invalidConfig = { ...config, apiKey: undefined };
      const invalidAdapter = new SabnzbdAdapter(invalidConfig);

      await expect(invalidAdapter.initialize()).rejects.toThrow('API key is required');
    });
  });

  describe('health check', () => {
    it('should return healthy status when SABnzbd is accessible', async () => {
      const mockResponse = {
        success: true,
        data: {
          status: true,
          queue: {
            noofslots: 2,
            speed: '2.5M'
          }
        }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.healthCheck();

      expect(result.status).toBe(ServiceStatus.ACTIVE);
      expect(result.details).toHaveProperty('queueSize', 2);
      expect(result.details).toHaveProperty('speed', '2.5M');
    });
  });

  describe('queue operations', () => {
    const mockQueue = {
      status: 'Downloading',
      speedlimit: '100',
      speed: '2.5M',
      queue_size: '10.5 GB',
      queue_mb: '10752',
      queue_mbleft: '5120',
      eta: '2:15:30',
      timeleft: '02:15:30',
      paused: false,
      slots: [
        {
          status: 'Downloading',
          index: 1,
          password: '',
          avg_age: '1d',
          script: 'Default',
          nzb_name: 'Ubuntu.22.04.nzb',
          mb: '2048',
          mbleft: '1024',
          percentage: '50',
          nzo_id: 'SABnzbd_nzo_123',
          timeleft: '01:07:45',
          eta: '1:07:45',
          category: 'linux',
          priority: '0'
        }
      ]
    };

    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get queue status', async () => {
      const mockResponse = {
        success: true,
        data: mockQueue
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getQueue();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQueue);
    });

    it('should pause queue', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.pauseQueue();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });

    it('should resume queue', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.resumeQueue();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });

    it('should delete job from queue', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.deleteJob('SABnzbd_nzo_123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });

    it('should change job priority', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.changeJobPriority('SABnzbd_nzo_123', 1);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });

    it('should change job category', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.changeJobCategory('SABnzbd_nzo_123', 'movies');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });
  });

  describe('history operations', () => {
    const mockHistory = {
      total_size: '50.2 GB',
      month_size: '10.5 GB',
      week_size: '2.1 GB',
      day_size: '512 MB',
      slots: [
        {
          action_line: 'Downloaded "Ubuntu.22.04.iso"',
          show_details: false,
          script_log: '',
          meta: '',
          fail_message: '',
          url: 'https://example.com/Ubuntu.22.04.nzb',
          nzb_name: 'Ubuntu.22.04.nzb',
          download_time: '01:15:30',
          storage: '/downloads/complete',
          path: '/downloads/complete/Ubuntu.22.04.iso',
          script: 'Default',
          nzo_id: 'SABnzbd_nzo_123',
          size: '2.5 GB',
          category: 'linux',
          pp: '3',
          status: 'Completed',
          script_line: '',
          completed: 1614556800,
          nzb: 'Ubuntu.22.04.nzb',
          downloaded: 2684354560,
          report: '',
          password: ''
        }
      ]
    };

    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get history', async () => {
      const mockResponse = {
        success: true,
        data: mockHistory
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getHistory();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistory);
    });

    it('should delete history item', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.deleteHistoryItem('SABnzbd_nzo_123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });

    it('should delete all history', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.deleteAllHistory();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });
  });

  describe('NZB operations', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should add NZB by URL', async () => {
      const mockResponse = {
        success: true,
        data: {
          status: true,
          nzo_ids: ['SABnzbd_nzo_456']
        }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.addNzbByUrl('https://example.com/test.nzb', 'movies', 0, 'Test NZB');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
      expect(result.data?.nzo_ids).toEqual(['SABnzbd_nzo_456']);
    });

    it('should add NZB file', async () => {
      const mockResponse = {
        success: true,
        data: {
          status: true,
          nzo_ids: ['SABnzbd_nzo_789']
        }
      };

      jest.spyOn(adapter as any, 'post').mockResolvedValue(mockResponse);

      const result = await adapter.addNzbFile('test.nzb', 'base64content', 'tv');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
      expect(result.data?.nzo_ids).toEqual(['SABnzbd_nzo_789']);
    });
  });

  describe('category operations', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get categories', async () => {
      const mockCategories = [
        {
          name: 'movies',
          dir: '/downloads/movies',
          priority: 0,
          script: 'Default',
          pp: '3'
        },
        {
          name: 'tv',
          dir: '/downloads/tv',
          priority: 0,
          script: 'Default',
          pp: '3'
        }
      ];

      const mockResponse = {
        success: true,
        data: mockCategories
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getCategories();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCategories);
    });

    it('should add category', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.addCategory('anime', '/downloads/anime', 0, 'Default', '3');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });

    it('should delete category', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.deleteCategory('anime');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });
  });

  describe('server operations', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get servers', async () => {
      const mockServers = [
        {
          host: 'news.example.com',
          port: 563,
          username: 'user',
          priority: 0,
          ssl: true,
          retention: 3000,
          connections: 20,
          displayname: 'Primary Server'
        }
      ];

      const mockResponse = {
        success: true,
        data: mockServers
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getServers();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockServers);
    });

    it('should add server', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.addServer('news.newsserver.com', 563, 'user', 'pass', 1, true);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });

    it('should delete server', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.deleteServer('news.example.com');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });

    it('should test server connection', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.testServer('news.example.com', 563, 'user', 'pass', true);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });
  });

  describe('system operations', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get version', async () => {
      const mockResponse = {
        success: true,
        data: { version: '4.0.3' }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getVersion();

      expect(result.success).toBe(true);
      expect(result.data?.version).toBe('4.0.3');
    });

    it('should shutdown SABnzbd', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.shutdown();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });

    it('should restart SABnzbd', async () => {
      const mockResponse = {
        success: true,
        data: { status: true }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.restart();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(true);
    });
  });

  describe('URL building', () => {
    it('should include API key in URL', () => {
      const url = (adapter as any).buildUrl('/queue', { limit: 10 });
      expect(url).toContain('apikey=test-sabnzbd-api-key');
      expect(url).toContain('limit=10');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should handle SABnzbd-specific errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { message: 'Invalid request' }
        }
      };

      const error = adapter.handleError(axiosError, 'test operation');

      expect(error.code).toBe('SABNZBD_BAD_REQUEST');
      expect(error.message).toBe('Invalid request data');
    });

    it('should handle unauthorized errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'Invalid API key' }
        }
      };

      const error = adapter.handleError(axiosError, 'test operation');

      expect(error.code).toBe('SABNZBD_UNAUTHORIZED');
      expect(error.message).toBe('API key invalid or missing');
    });
  });
});