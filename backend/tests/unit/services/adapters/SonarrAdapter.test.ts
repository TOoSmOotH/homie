import { SonarrAdapter } from '../../../../src/services/adapters/SonarrAdapter';
import { AdapterConfig, AdapterResponse, HealthCheckResult } from '../../../../src/types/adapter.types';
import { ServiceType, AuthenticationType, ServiceStatus } from '../../../../src/models/ServiceConfig';

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('SonarrAdapter', () => {
  let adapter: SonarrAdapter;
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
      baseUrl: 'https://sonarr.example.com',
      port: 8989,
      useSSL: true,
      verifySSL: true,
      authType: AuthenticationType.API_KEY,
      apiKey: 'test-sonarr-api-key',
      timeout: 5000,
      maxRetries: 3
    };

    adapter = new SonarrAdapter(config);
  });

  describe('initialization', () => {
    it('should initialize with correct service type', async () => {
      await adapter.initialize();
      expect(adapter.serviceType).toBe(ServiceType.SONARR);
    });

    it('should validate Sonarr-specific configuration', async () => {
      const invalidConfig = { ...config, apiKey: undefined };
      const invalidAdapter = new SonarrAdapter(invalidConfig);

      await expect(invalidAdapter.initialize()).rejects.toThrow('API key is required');
    });
  });

  describe('health check', () => {
    it('should return healthy status when Sonarr is accessible', async () => {
      const mockResponse = {
        success: true,
        data: {
          version: '3.0.10.1567',
          buildTime: '2023-01-01T00:00:00Z',
          isDebug: false,
          isProduction: true,
          isAdmin: true,
          isUserInteractive: true,
          startupPath: '/app',
          appData: '/config',
          osVersion: 'Linux 5.4.0',
          branch: 'main'
        }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.healthCheck();

      expect(result.status).toBe(ServiceStatus.ACTIVE);
      expect(result.version).toBe('3.0.10.1567');
      expect(result.details).toHaveProperty('version');
      expect(result.details).toHaveProperty('branch');
    });

    it('should return error status when Sonarr is not accessible', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Connection failed' }
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.healthCheck();

      expect(result.status).toBe(ServiceStatus.ERROR);
    });
  });

  describe('series operations', () => {
    const mockSeries = {
      id: 1,
      title: 'Breaking Bad',
      alternateTitles: [],
      sortTitle: 'breaking bad',
      status: 'ended',
      ended: true,
      overview: 'A high school chemistry teacher...',
      network: 'AMC',
      airTime: '21:00',
      images: [
        {
          coverType: 'poster',
          url: '/MediaCover/1/poster.jpg'
        }
      ],
      seasons: [
        {
          seasonNumber: 1,
          monitored: true,
          episodeCount: 7,
          episodeFileCount: 7,
          totalEpisodeCount: 7
        }
      ],
      year: 2008,
      path: '/tv/Breaking Bad',
      qualityProfileId: 1,
      languageProfileId: 1,
      seasonFolder: true,
      monitored: true,
      useSceneNumbering: false,
      runtime: 47,
      tvdbId: 81189,
      tvRageId: 18164,
      tvMazeId: 169,
      firstAired: '2008-01-20T00:00:00Z',
      seriesType: 'standard',
      cleanTitle: 'breakingbad',
      imdbId: 'tt0903747',
      titleSlug: 'breaking-bad',
      certification: 'TV-MA',
      genres: ['Crime', 'Drama', 'Thriller'],
      tags: [],
      added: '2023-01-01T00:00:00Z',
      ratings: {
        votes: 1000,
        value: 9.5
      }
    };

    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get all series', async () => {
      const mockResponse = {
        success: true,
        data: [mockSeries]
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getSeries();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockSeries]);
    });

    it('should get series by ID', async () => {
      const mockResponse = {
        success: true,
        data: mockSeries
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getSeriesById(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSeries);
    });

    it('should lookup series', async () => {
      const mockResponse = {
        success: true,
        data: [mockSeries]
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.lookupSeries('Breaking Bad');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockSeries]);
    });

    it('should add series', async () => {
      const seriesOptions = {
        tvdbId: 81189,
        qualityProfileId: 1,
        rootFolderPath: '/tv',
        seasonFolder: true,
        monitored: true
      };

      const mockResponse = {
        success: true,
        data: { ...mockSeries, ...seriesOptions }
      };

      jest.spyOn(adapter as any, 'post').mockResolvedValue(mockResponse);

      const result = await adapter.addSeries(seriesOptions);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(seriesOptions);
    });

    it('should update series', async () => {
      const updateOptions = {
        monitored: false,
        qualityProfileId: 2
      };

      const mockResponse = {
        success: true,
        data: { ...mockSeries, ...updateOptions }
      };

      jest.spyOn(adapter as any, 'put').mockResolvedValue(mockResponse);

      const result = await adapter.updateSeries(1, updateOptions);

      expect(result.success).toBe(true);
      expect(result.data?.monitored).toBe(false);
      expect(result.data?.qualityProfileId).toBe(2);
    });

    it('should delete series', async () => {
      const mockResponse = {
        success: true,
        data: undefined
      };

      jest.spyOn(adapter as any, 'delete').mockResolvedValue(mockResponse);

      const result = await adapter.deleteSeries(1, true, true);

      expect(result.success).toBe(true);
    });
  });

  describe('episode operations', () => {
    const mockEpisode = {
      id: 1,
      episodeNumber: 1,
      seasonNumber: 1,
      title: 'Pilot',
      airDate: '2008-01-20',
      overview: 'Walter White learns he has terminal lung cancer...',
      hasFile: true,
      monitored: true,
      seriesId: 1
    };

    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get episodes for series', async () => {
      const mockResponse = {
        success: true,
        data: [mockEpisode]
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getEpisodes(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockEpisode]);
    });

    it('should get episode by ID', async () => {
      const mockResponse = {
        success: true,
        data: mockEpisode
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getEpisode(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEpisode);
    });

    it('should monitor episodes', async () => {
      const mockResponse = {
        success: true,
        data: undefined
      };

      jest.spyOn(adapter as any, 'put').mockResolvedValue(mockResponse);

      const result = await adapter.monitorEpisodes([1, 2], true);

      expect(result.success).toBe(true);
    });

    it('should search for episodes', async () => {
      const mockResponse = {
        success: true,
        data: undefined
      };

      jest.spyOn(adapter as any, 'post').mockResolvedValue(mockResponse);

      const result = await adapter.searchEpisodes(1);

      expect(result.success).toBe(true);
    });
  });

  describe('queue and history operations', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get queue', async () => {
      const mockQueue = {
        records: [
          {
            series: { title: 'Breaking Bad' },
            episode: { title: 'Pilot' },
            status: 'downloading',
            size: 1000000,
            sizeleft: 500000
          }
        ],
        totalRecords: 1
      };

      const mockResponse = {
        success: true,
        data: mockQueue
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getQueue();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQueue);
    });

    it('should get history', async () => {
      const mockHistory = {
        records: [
          {
            series: { title: 'Breaking Bad' },
            episode: { title: 'Pilot' },
            eventType: 'downloadFolderImported',
            date: '2023-01-01T00:00:00Z'
          }
        ],
        totalRecords: 1
      };

      const mockResponse = {
        success: true,
        data: mockHistory
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getHistory();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistory);
    });

    it('should search all missing episodes', async () => {
      const mockResponse = {
        success: true,
        data: undefined
      };

      jest.spyOn(adapter as any, 'post').mockResolvedValue(mockResponse);

      const result = await adapter.searchAllMissing();

      expect(result.success).toBe(true);
    });
  });

  describe('quality profiles', () => {
    const mockQualityProfile = {
      id: 1,
      name: 'HD-1080p',
      cutoff: {
        id: 1,
        name: 'Bluray-1080p',
        source: 'bluray',
        resolution: 1080
      },
      items: [
        {
          quality: {
            id: 1,
            name: 'Bluray-1080p',
            source: 'bluray',
            resolution: 1080
          },
          allowed: true
        }
      ]
    };

    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get quality profiles', async () => {
      const mockResponse = {
        success: true,
        data: [mockQualityProfile]
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getQualityProfiles();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockQualityProfile]);
    });

    it('should add quality profile', async () => {
      const profileData = {
        name: 'New Profile',
        cutoff: {
          id: 1,
          name: 'Bluray-1080p',
          source: 'bluray',
          resolution: 1080
        },
        items: []
      };

      const mockResponse = {
        success: true,
        data: { ...profileData, id: 2 }
      };

      jest.spyOn(adapter as any, 'post').mockResolvedValue(mockResponse);

      const result = await adapter.addQualityProfile(profileData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(2);
    });
  });

  describe('calendar operations', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get calendar', async () => {
      const mockCalendar = [
        {
          id: 1,
          episodeNumber: 1,
          seasonNumber: 1,
          title: 'Pilot',
          airDate: '2008-01-20',
          series: {
            id: 1,
            title: 'Breaking Bad'
          }
        }
      ];

      const mockResponse = {
        success: true,
        data: mockCalendar
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getCalendar('2023-01-01', '2023-01-31');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCalendar);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should handle Sonarr-specific errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { message: 'Invalid series data' }
        }
      };

      const error = adapter.handleError(axiosError, 'test operation');

      expect(error.code).toBe('SONARR_BAD_REQUEST');
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

      expect(error.code).toBe('SONARR_UNAUTHORIZED');
      expect(error.message).toBe('API key invalid or missing');
    });
  });
});