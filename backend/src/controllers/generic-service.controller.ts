import { Request, Response, NextFunction } from 'express';
import axios, { AxiosRequestConfig } from 'axios';
import http from 'http';
// Import ssh2 via require to avoid type dependency
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Client: SSHClient } = require('ssh2');
const WebSocket = require('ws');
import { dbConnection } from '../database/connection';
import { Service, ServiceStatus } from '../models/Service';
import { logger } from '../utils/logger';
import { validateDockerRequest, validateSshCommand } from '../utils/transportGuards';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export class GenericServiceController {
  /**
   * Generic data fetcher for any service based on marketplace definition
   */
  fetchData = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { endpoint, params } = req.body;

      logger.info(`Fetching data for service ${id}, endpoint: ${endpoint}`);

      // Get service with definition
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);
      
      const service = await serviceRepository.findOne({
        where: { id },
        relations: ['definition']
      });

      if (!service) {
        res.status(404).json({
          success: false,
          error: { message: 'Service not found' }
        });
        return;
      }

      // Check if service is configured
      if (!service.config?.url) {
        res.status(400).json({
          success: false,
          error: { message: 'Service not configured. Please configure in settings.' }
        });
        return;
      }

      // Check if definition exists
      if (!service.definition) {
        logger.error(`Service ${id} has no definition loaded`);
        res.status(400).json({
          success: false,
          error: { message: 'Service definition not found. Please reinstall the service.' }
        });
        return;
      }

      // Check if manifest exists
      if (!service.definition.manifest) {
        logger.error(`Service ${id} definition has no manifest`);
        res.status(400).json({
          success: false,
          error: { message: 'Service manifest not found. Please reinstall the service.' }
        });
        return;
      }

      // Get endpoint definition from marketplace
      const endpointDef: any = service.definition.manifest?.api?.endpoints?.[endpoint];
      
      if (!endpointDef) {
        logger.error(`Unknown endpoint: ${endpoint} for service ${id}`);
        logger.debug(`Available endpoints: ${Object.keys(service.definition.manifest?.api?.endpoints || {}).join(', ')}`);
        res.status(400).json({
          success: false,
          error: { message: `Unknown endpoint: ${endpoint}` }
        });
        return;
      }

      const transport = endpointDef.transport || 'http';
      let responseData: any;

      if (transport === 'http') {
        // Build request configuration (HTTP)
        const requestConfig: AxiosRequestConfig = {
          method: endpointDef.method || 'GET',
          url: `${service.config.url}${endpointDef.path}`,
          timeout: 10000
        };

        // Add headers
        const headers: any = {};
        if (service.definition?.manifest?.api?.headers) {
          for (const [key, value] of Object.entries(service.definition.manifest.api.headers)) {
            headers[key] = this.interpolateValue(value as string, service.config);
          }
        }
        requestConfig.headers = headers;

        // Add params
        if (endpointDef.params) {
          const interpolatedParams: any = {};
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const endOfWeek = new Date(now);
          endOfWeek.setDate(now.getDate() + (6 - now.getDay()));

          const defaultParams = {
            startDate: startOfWeek.toISOString().split('T')[0],
            endDate: endOfWeek.toISOString().split('T')[0],
            ...params
          };

          for (const [key, value] of Object.entries(endpointDef.params)) {
            const interpolated = this.interpolateValue(value as string, { ...service.config, ...defaultParams });
            if (!interpolated.includes('{')) {
              interpolatedParams[key] = interpolated;
            }
          }
          requestConfig.params = interpolatedParams;
        }

        // Add body for POST/PUT requests
        if (endpointDef.body && (endpointDef.method === 'POST' || endpointDef.method === 'PUT')) {
          requestConfig.data = endpointDef.body;
        }

        logger.debug(`Making HTTP request to: ${requestConfig.url}`);
        const response = await axios(requestConfig);
        responseData = response.data;
      } else if (transport === 'docker') {
        // Docker socket request (unix socket)
        const socketPath = service.config?.dockerSocketPath || process.env.DOCKER_SOCKET || '/var/run/docker.sock';
        const method = (endpointDef.method || 'GET').toUpperCase();

        // Build query string
        let path = endpointDef.path as string;
        // Validate before making request
        validateDockerRequest(method, path);
        if (endpointDef.params) {
          const queryParams: Record<string, string> = {};
          for (const [key, value] of Object.entries(endpointDef.params)) {
            const interpolated = this.interpolateValue(value as string, { ...service.config, ...(params || {}) });
            if (!interpolated.includes('{')) queryParams[key] = interpolated;
          }
          const qs = new URLSearchParams(queryParams).toString();
          if (qs) path += (path.includes('?') ? '&' : '?') + qs;
        }

        const options: http.RequestOptions = {
          socketPath,
          path,
          method,
          headers: {
            'Accept': 'application/json'
          }
        };

        responseData = await new Promise<any>((resolve, reject) => {
          const req = http.request(options, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                const json = data ? JSON.parse(data) : {};
                resolve(json);
              } catch {
                resolve(data);
              }
            });
          });
          req.on('error', (err) => reject(err));
          if (endpointDef.body && (method === 'POST' || method === 'PUT')) {
            const bodyStr = typeof endpointDef.body === 'string' ? endpointDef.body : JSON.stringify(endpointDef.body);
            req.write(bodyStr);
          }
          req.end();
        });
      } else if (transport === 'ssh') {
        // SSH command execution
        const sshHost = service.config?.sshHost || service.config?.host;
        const sshPort = service.config?.sshPort || 22;
        const sshUsername = service.config?.sshUsername || service.config?.username;
        const sshPassword = service.config?.sshPassword;
        const sshPrivateKey = service.config?.sshPrivateKey;
        const command = endpointDef.command as string;

        if (!sshHost || !sshUsername || (!sshPassword && !sshPrivateKey)) {
          throw new Error('SSH configuration incomplete: host, username, and password or privateKey are required');
        }
        if (!command) {
          throw new Error('SSH endpoint requires a command');
        }

        // Validate command
        validateSshCommand(command);
        const conn = new SSHClient();
        responseData = await new Promise<any>((resolve, reject) => {
          conn
            .on('ready', () => {
              conn.exec(command, { timeout: 10000 }, (err: any, stream: any) => {
                if (err) {
                  conn.end();
                  return reject(err);
                }
                let stdout = '';
                let stderr = '';
                stream
                  .on('close', (code: number) => {
                    conn.end();
                    if (code !== 0 && !endpointDef.allowNonZeroExit) {
                      return reject(new Error(stderr || `Command exited with code ${code}`));
                    }
                    // parse JSON if requested
                    if (endpointDef.parser === 'json') {
                      try {
                        resolve(JSON.parse(stdout));
                      } catch (e) {
                        reject(new Error('Failed to parse JSON output'));
                      }
                    } else {
                      resolve(stdout);
                    }
                  })
                  .on('data', (data: Buffer | string) => (stdout += data.toString()))
                  .stderr.on('data', (data: Buffer | string) => (stderr += data.toString()));
              });
            })
            .on('error', (e: any) => reject(e))
            .connect({
              host: sshHost,
              port: sshPort,
              username: sshUsername,
              password: sshPassword,
              privateKey: sshPrivateKey
            });
        });
      } else if (transport === 'ws') {
        // WebSocket transport: connect, optionally send a message, await first response
        // Determine WS URL
        let wsUrl: string | undefined = endpointDef.url as string | undefined;
        if (!wsUrl) {
          // Derive from service.config.url + path, switching scheme to ws/wss
          const base = new URL(service.config.url);
          const scheme = base.protocol === 'https:' ? 'wss:' : 'ws:';
          const path = (endpointDef.path || '').toString();
          wsUrl = `${scheme}//${base.host}${path.startsWith('/') ? path : `/${path}`}`;
        }
        if (!wsUrl) throw new Error('WebSocket URL is required');

        // Headers (if any)
        const headers: any = {};
        if (endpointDef.headers) {
          for (const [key, value] of Object.entries(endpointDef.headers)) {
            headers[key] = this.interpolateValue(value as string, service.config);
          }
        }

        const timeoutMs = endpointDef.timeout || 5000;
        responseData = await new Promise<any>((resolve, reject) => {
          const ws = new WebSocket(wsUrl!, { headers });
          let settled = false;
          const timer = setTimeout(() => {
            if (!settled) {
              settled = true;
              try { ws.close(); } catch {}
              reject(new Error('WebSocket timeout'));
            }
          }, timeoutMs);

          ws.on('open', () => {
            if (endpointDef.message) {
              const msg = this.interpolateValue(String(endpointDef.message), { ...service.config, ...(params || {}) });
              ws.send(msg);
            }
          });

          ws.on('message', (data: any) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try {
              const text = data.toString();
              if (endpointDef.parser === 'json') {
                resolve(JSON.parse(text));
              } else {
                resolve(text);
              }
            } catch (e) {
              resolve(data);
            } finally {
              try { ws.close(); } catch {}
            }
          });

          ws.on('error', (err: any) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            reject(err);
          });
        });
      } else {
        throw new Error(`Unsupported transport: ${transport}`);
      }
      // Apply transformation if specified
      if (endpointDef.transform) {
        try {
          logger.debug(`Applying transform: ${endpointDef.transform}`);
          const transformFn = new Function('response', `return ${endpointDef.transform}`);
          responseData = transformFn(responseData);
        } catch (e) {
          logger.error('Transform error:', e);
          logger.error('Transform function:', endpointDef.transform);
          logger.error('Response data:', JSON.stringify(responseData).substring(0, 200));
          // Return untransformed data if transform fails
          // keep responseData as-is
        }
      }

      // Update service status to online
      await serviceRepository.update(id, {
        status: ServiceStatus.ONLINE,
        lastChecked: new Date()
      });

      res.json({
        success: true,
        data: responseData
      });
    } catch (error: any) {
      logger.error('Error fetching service data:', error);
      logger.error('Error stack:', error.stack);
      
      // Update service status to offline if connection failed
      if (axios.isAxiosError(error)) {
        try {
          const dataSource = dbConnection.getDataSource();
          const serviceRepository = dataSource.getRepository(Service);
          await serviceRepository.update(req.params.id, {
            status: ServiceStatus.OFFLINE,
            lastChecked: new Date()
          });
        } catch (updateError) {
          logger.error('Error updating service status:', updateError);
        }

        res.status(error.response?.status || 500).json({
          success: false,
          error: { 
            message: error.response?.status === 401 
              ? 'Authentication failed. Check your credentials.'
              : error.response?.data?.message || 'Failed to connect to service'
          }
        });
      } else {
        // Send error response instead of passing to next() to prevent crashes
        res.status(500).json({
          success: false,
          error: { 
            message: 'Internal server error while fetching data',
            details: error.message
          }
        });
      }
    }
  };

  /**
   * Test service connection
   */
  testConnection = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Get service with definition
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);
      
      const service = await serviceRepository.findOne({
        where: { id },
        relations: ['definition']
      });

      if (!service) {
        res.status(404).json({
          success: false,
          error: { message: 'Service not found' }
        });
        return;
      }

      // Check if service is configured
      if (!service.config?.url) {
        res.status(400).json({
          success: false,
          error: { message: 'Service not configured' }
        });
        return;
      }

      // Get test endpoint from definition
      const testEndpoint = service.definition?.manifest?.connection?.testEndpoint;
      
      if (!testEndpoint) {
        res.status(400).json({
          success: false,
          error: { message: 'No test endpoint defined for this service' }
        });
        return;
      }

      // Build request
      const headers: any = {};
      if (testEndpoint.headers) {
        for (const [key, value] of Object.entries(testEndpoint.headers)) {
          headers[key] = this.interpolateValue(value as string, service.config);
        }
      }

      const response = await axios({
        method: testEndpoint.method || 'GET',
        url: `${service.config.url}${testEndpoint.path}`,
        headers,
        timeout: 5000
      });

      // Check for success indicator
      const success = testEndpoint.successIndicator 
        ? response.data[testEndpoint.successIndicator] !== undefined
        : response.status === (testEndpoint.expectedStatus || 200);

      if (success) {
        // Update service status
        await serviceRepository.update(id, {
          status: ServiceStatus.ONLINE,
          lastChecked: new Date()
        });

        res.json({
          success: true,
          message: 'Connection successful',
          data: response.data
        });
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      logger.error('Error testing connection:', error);
      
      // Update service status
      try {
        const dataSource = dbConnection.getDataSource();
        const serviceRepository = dataSource.getRepository(Service);
        await serviceRepository.update(req.params.id, {
          status: ServiceStatus.OFFLINE,
          lastChecked: new Date()
        });
      } catch (updateError) {
        logger.error('Error updating service status:', updateError);
      }

      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          success: false,
          error: { 
            message: error.response?.status === 401 
              ? 'Authentication failed'
              : 'Connection test failed'
          }
        });
      } else {
        next(error);
      }
    }
  };

  /**
   * Execute a quick action
   */
  executeAction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { actionId } = req.body;

      // Get service with definition
      const dataSource = dbConnection.getDataSource();
      const serviceRepository = dataSource.getRepository(Service);
      
      const service = await serviceRepository.findOne({
        where: { id },
        relations: ['definition']
      });

      if (!service) {
        res.status(404).json({
          success: false,
          error: { message: 'Service not found' }
        });
        return;
      }

      // Find the action
      const action = service.definition?.manifest?.quickActions?.find((a: any) => a.id === actionId);
      
      if (!action) {
        res.status(400).json({
          success: false,
          error: { message: `Unknown action: ${actionId}` }
        });
        return;
      }

      // Check if action has API configuration
      if (!action.api) {
        res.status(400).json({
          success: false,
          error: { message: 'Action does not have API configuration' }
        });
        return;
      }

      // Execute the action
      const headers: any = {};
      if (service.definition?.manifest?.api?.headers) {
        for (const [key, value] of Object.entries(service.definition.manifest.api.headers)) {
          headers[key] = this.interpolateValue(value as string, service.config);
        }
      }

      const response = await axios({
        method: action.api.method || 'POST',
        url: `${service.config.url}${action.api.endpoint}`,
        headers,
        data: action.api.body,
        timeout: 10000
      });

      res.json({
        success: true,
        message: `Action '${action.name}' executed successfully`,
        data: response.data
      });
    } catch (error) {
      logger.error('Error executing action:', error);
      
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          success: false,
          error: { message: 'Failed to execute action' }
        });
      } else {
        next(error);
      }
    }
  };

  /**
   * Helper to interpolate values with placeholders
   */
  private interpolateValue(template: string, data: any): string {
    return template.replace(/\{([^}]+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }
}
