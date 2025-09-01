import { GenericServiceController } from '../../../src/controllers/generic-service.controller';
import { dbConnection } from '../../../src/database/connection';
import axios from 'axios';
import http from 'http';

jest.mock('axios');

describe('GenericServiceController.fetchData', () => {
  const controller = new GenericServiceController();
  const mockRepo = {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined)
  };
  const mockDs = {
    getRepository: jest.fn().mockReturnValue(mockRepo)
  } as any;

  beforeEach(() => {
    jest.resetAllMocks();
    (dbConnection as any).getDataSource = jest.fn().mockReturnValue(mockDs);
    (mockDs as any).getRepository = jest.fn().mockReturnValue(mockRepo);
  });

  const makeRes = () => {
    return {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    } as any;
  };

  const baseService = (endpointKey: string, endpointDef: any, config: any = {}) => ({
    id: 'svc1',
    config: { url: 'http://example.local', ...config },
    definition: {
      manifest: {
        api: {
          endpoints: {
            [endpointKey]: endpointDef
          }
        }
      }
    }
  });

  it('handles HTTP transport', async () => {
    // Arrange
    const svc = baseService('status', { transport: 'http', method: 'GET', path: '/health' });
    mockRepo.findOne.mockResolvedValueOnce(svc);
    (axios as any).mockResolvedValueOnce({ data: { ok: true } });

    const req: any = { params: { id: 'svc1' }, body: { endpoint: 'status' } };
    const res = makeRes();

    // Act
    await controller.fetchData(req, res, jest.fn());

    // Assert
    expect(axios).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { ok: true } }));
  });


  it('blocks Docker transport on disallowed path', async () => {
    const svc = baseService('create', { transport: 'docker', method: 'POST', path: '/containers/create' });
    mockRepo.findOne.mockResolvedValueOnce(svc);
    const req: any = { params: { id: 'svc1' }, body: { endpoint: 'create' } };
    const res = makeRes();

    await controller.fetchData(req, res, jest.fn());
    expect(res.status).toHaveBeenCalled();
  });
});
