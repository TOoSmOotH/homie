import { RadarrAdapter } from '../../../../src/services/adapters/RadarrAdapter';
import { AdapterConfig, AdapterResponse, HealthCheckResult } from '../../../../src/types/adapter.types';
import { ServiceType, AuthenticationType, ServiceStatus } from '../../../../src/models/ServiceConfig';

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('RadarrAdapter', () => {
  let adapter: RadarrAdapter;
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
      baseUrl: 'https://radarr.example.com',
      port: 7878,
      useSSL: true,
      verifySSL: true,
      authType: AuthenticationType.API_KEY,
      apiKey: 'test-radarr-api-key',
      timeout: 5000,
      maxRetries: 3
    };

    adapter = new RadarrAdapter(config);
  });

  describe('initialization', () => {
    it('should initialize with correct service type', async () => {
      await adapter.initialize();
      expect(adapter.serviceType).toBe(ServiceType.RADARR);
    });

    it('should validate Radarr-specific configuration', async () => {
      const invalidConfig = { ...config, apiKey: undefined };
      const invalidAdapter = new RadarrAdapter(invalidConfig);

      await expect(invalidAdapter.initialize()).rejects.toThrow('API key is required');
    });
  });

  describe('health check', () => {
    it('should return healthy status when Radarr is accessible', async () => {
      const mockResponse = {
        success: true,
        data: {
          version: '4.2.4.6635',
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
      expect(result.version).toBe('4.2.4.6635');
      expect(result.details).toHaveProperty('version');
      expect(result.details).toHaveProperty('branch');
    });
  });

  describe('movie operations', () => {
    const mockMovie = {
      id: 1,
      title: 'The Dark Knight',
      sortTitle: 'dark knight',
      sizeOnDisk: 8000000000,
      overview: 'When the menace known as the Joker...',
      inCinemas: '2008-07-18T00:00:00Z',
      physicalRelease: '2008-12-09T00:00:00Z',
      images: [
        {
          coverType: 'poster',
          url: '/MediaCover/1/poster.jpg'
        }
      ],
      website: 'https://www.thedarkknight.com',
      year: 2008,
      hasFile: true,
      youTubeTrailerId: 'EXeTwQWrcwY',
      studio: 'Warner Bros. Pictures',
      path: '/movies/The Dark Knight (2008)',
      qualityProfileId: 1,
      monitored: true,
      minimumAvailability: 'released',
      isAvailable: true,
      folderName: 'The Dark Knight (2008)',
      runtime: 152,
      cleanTitle: 'darkknight',
      imdbId: 'tt0468569',
      tmdbId: 155,
      titleSlug: 'the-dark-knight-2008',
      certification: 'PG-13',
      genres: ['Action', 'Crime', 'Drama'],
      tags: [],
      added: '2023-01-01T00:00:00Z',
      ratings: {
        votes: 2000,
        value: 9.0
      }
    };

    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get all movies', async () => {
      const mockResponse = {
        success: true,
        data: [mockMovie]
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getMovies();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockMovie]);
    });

    it('should get movie by ID', async () => {
      const mockResponse = {
        success: true,
        data: mockMovie
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getMovieById(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMovie);
    });

    it('should lookup movie', async () => {
      const mockResponse = {
        success: true,
        data: [mockMovie]
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.lookupMovie('The Dark Knight');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockMovie]);
    });

    it('should add movie', async () => {
      const movieOptions = {
        tmdbId: 155,
        qualityProfileId: 1,
        rootFolderPath: '/movies',
        monitored: true,
        minimumAvailability: 'released'
      };

      const mockResponse = {
        success: true,
        data: { ...mockMovie, ...movieOptions }
      };

      jest.spyOn(adapter as any, 'post').mockResolvedValue(mockResponse);

      const result = await adapter.addMovie(movieOptions);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(movieOptions);
    });

    it('should update movie', async () => {
      const updateOptions = {
        monitored: false,
        qualityProfileId: 2
      };

      const mockResponse = {
        success: true,
        data: { ...mockMovie, ...updateOptions }
      };

      jest.spyOn(adapter as any, 'put').mockResolvedValue(mockResponse);

      const result = await adapter.updateMovie(1, updateOptions);

      expect(result.success).toBe(true);
      expect(result.data?.monitored).toBe(false);
      expect(result.data?.qualityProfileId).toBe(2);
    });

    it('should delete movie', async () => {
      const mockResponse = {
        success: true,
        data: undefined
      };

      jest.spyOn(adapter as any, 'delete').mockResolvedValue(mockResponse);

      const result = await adapter.deleteMovie(1, true, true);

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
            movie: { title: 'The Dark Knight' },
            status: 'downloading',
            size: 8000000000,
            sizeleft: 4000000000
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
            movie: { title: 'The Dark Knight' },
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

    it('should search for movie', async () => {
      const mockResponse = {
        success: true,
        data: undefined
      };

      jest.spyOn(adapter as any, 'post').mockResolvedValue(mockResponse);

      const result = await adapter.searchMovie(1);

      expect(result.success).toBe(true);
    });

    it('should search all missing movies', async () => {
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
          title: 'The Dark Knight',
          inCinemas: '2008-07-18T00:00:00Z',
          physicalRelease: '2008-12-09T00:00:00Z',
          year: 2008
        }
      ];

      const mockResponse = {
        success: true,
        data: mockCalendar
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getCalendar('2023-01-01', '2023-12-31');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCalendar);
    });
  });

  describe('collections', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get collections', async () => {
      const mockCollection = {
        id: 1,
        title: 'Dark Knight Collection',
        tmdbId: 263,
        monitored: true,
        movies: []
      };

      const mockResponse = {
        success: true,
        data: [mockCollection]
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getCollections();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockCollection]);
    });

    it('should get collection by ID', async () => {
      const mockCollection = {
        id: 1,
        title: 'Dark Knight Collection',
        tmdbId: 263,
        monitored: true,
        movies: []
      };

      const mockResponse = {
        success: true,
        data: mockCollection
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getCollection(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCollection);
    });
  });

  describe('import lists', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get import lists', async () => {
      const mockImportList = {
        id: 1,
        name: 'Trakt List',
        implementationName: 'TraktImport',
        implementation: 'TraktImport',
        configContract: 'TraktSettings',
        enabled: true,
        enableAuto: true
      };

      const mockResponse = {
        success: true,
        data: [mockImportList]
      };

      jest.spyOn(adapter as any, 'get').mockResolvedValue(mockResponse);

      const result = await adapter.getImportLists();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockImportList]);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should handle Radarr-specific errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { message: 'Invalid movie data' }
        }
      };

      const error = adapter.handleError(axiosError, 'test operation');

      expect(error.code).toBe('RADARR_BAD_REQUEST');
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

      expect(error.code).toBe('RADARR_UNAUTHORIZED');
      expect(error.message).toBe('API key invalid or missing');
    });
  });
});