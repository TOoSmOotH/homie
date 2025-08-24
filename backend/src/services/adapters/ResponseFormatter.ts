import { AdapterResponse, AdapterError } from '../../types/adapter.types';
import { logger } from '../../utils/logger';

// Response format types
export interface StandardizedResponse<T = any> {
  success: boolean;
  data?: T;
  error?: StandardizedError;
  metadata: ResponseMetadata;
}

export interface StandardizedError {
  code: string;
  message: string;
  details?: any;
  httpStatus?: number;
  timestamp: string;
  correlationId: string;
  retryable: boolean;
  suggestions?: string[];
}

export interface ResponseMetadata {
  timestamp: string;
  correlationId: string;
  serviceType: string;
  operation: string;
  duration?: number;
  version?: string;
  nodeId?: string;
  cache?: CacheMetadata;
  pagination?: PaginationMetadata;
  rateLimit?: RateLimitMetadata;
}

export interface CacheMetadata {
  hit: boolean;
  ttl?: number;
  key?: string;
  source?: string;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RateLimitMetadata {
  limit: number;
  remaining: number;
  resetTime: string;
  windowSize: number;
}

// Response transformation options
export interface ResponseFormatOptions {
  includeMetadata?: boolean;
  includeErrorDetails?: boolean;
  includeTimestamps?: boolean;
  includeCorrelationId?: boolean;
  transformData?: (data: any) => any;
  filterFields?: string[];
  duration?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
  rateLimit?: {
    limit: number;
    remaining: number;
    resetTime: Date;
    windowSize: number;
  };
  cache?: {
    hit: boolean;
    ttl?: number;
    key?: string;
    source?: string;
  };
}

// Response formatter class
export class ResponseFormatter {
  private static instance: ResponseFormatter;
  private correlationCounter = 0;

  static getInstance(): ResponseFormatter {
    if (!ResponseFormatter.instance) {
      ResponseFormatter.instance = new ResponseFormatter();
    }
    return ResponseFormatter.instance;
  }

  // Format successful response
  formatSuccess<T = any>(
    data: T,
    operation: string,
    serviceType: string,
    options: ResponseFormatOptions = {}
  ): StandardizedResponse<T> {
    const correlationId = this.generateCorrelationId();
    const timestamp = new Date().toISOString();

    let formattedData = data;
    if (options.transformData) {
      formattedData = options.transformData(data);
    }

    if (options.filterFields && Array.isArray(formattedData)) {
      formattedData = this.filterFields(formattedData as any[], options.filterFields) as T;
    }

    const metadata: ResponseMetadata = {
      timestamp,
      correlationId,
      serviceType,
      operation,
      ...(options.includeMetadata && {
        nodeId: this.getNodeId(),
        version: this.getVersion()
      })
    };

    // Add pagination metadata if provided
    if (options.pagination) {
      metadata.pagination = {
        page: options.pagination.page,
        limit: options.pagination.limit,
        total: options.pagination.total,
        totalPages: Math.ceil(options.pagination.total / options.pagination.limit),
        hasNext: options.pagination.page < Math.ceil(options.pagination.total / options.pagination.limit),
        hasPrev: options.pagination.page > 1
      };
    }

    // Add rate limit metadata if provided
    if (options.rateLimit) {
      metadata.rateLimit = {
        limit: options.rateLimit.limit,
        remaining: options.rateLimit.remaining,
        resetTime: options.rateLimit.resetTime.toISOString(),
        windowSize: options.rateLimit.windowSize
      };
    }

    // Add cache metadata if provided
    if (options.cache) {
      metadata.cache = options.cache;
    }

    logger.debug('Formatted successful response', {
      correlationId,
      operation,
      serviceType,
      hasData: !!data
    });

    return {
      success: true,
      data: formattedData,
      metadata
    };
  }

  // Format error response
  formatError(
    error: AdapterError | Error | any,
    operation: string,
    serviceType: string,
    options: ResponseFormatOptions = {}
  ): StandardizedResponse<never> {
    const correlationId = this.generateCorrelationId();
    const timestamp = new Date().toISOString();

    const standardizedError: StandardizedError = {
      code: this.extractErrorCode(error),
      message: this.extractErrorMessage(error),
      details: options.includeErrorDetails ? this.extractErrorDetails(error) : undefined,
      httpStatus: this.extractHttpStatus(error),
      timestamp,
      correlationId,
      retryable: this.isRetryableError(error),
      suggestions: this.generateErrorSuggestions(error, operation, serviceType)
    };

    const metadata: ResponseMetadata = {
      timestamp,
      correlationId,
      serviceType,
      operation,
      ...(options.includeMetadata && {
        nodeId: this.getNodeId(),
        version: this.getVersion()
      })
    };

    logger.error('Formatted error response', {
      correlationId,
      operation,
      serviceType,
      errorCode: standardizedError.code,
      errorMessage: standardizedError.message,
      httpStatus: standardizedError.httpStatus
    });

    return {
      success: false,
      error: standardizedError,
      metadata
    };
  }

  // Format adapter response to standardized response
  formatAdapterResponse<T = any>(
    adapterResponse: AdapterResponse<T>,
    operation: string,
    serviceType: string,
    options: ResponseFormatOptions = {}
  ): StandardizedResponse<T> {
    if (adapterResponse.success && adapterResponse.data !== undefined) {
      return this.formatSuccess(
        adapterResponse.data,
        operation,
        serviceType,
        {
          ...options,
          duration: adapterResponse.metadata?.responseTime
        }
      );
    } else {
      return this.formatError(
        adapterResponse.error || new Error('Unknown error'),
        operation,
        serviceType,
        options
      );
    }
  }

  // Transform paginated data
  formatPaginatedResponse<T = any>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    operation: string,
    serviceType: string,
    options: ResponseFormatOptions = {}
  ): StandardizedResponse<T[]> {
    return this.formatSuccess(
      data,
      operation,
      serviceType,
      {
        ...options,
        pagination: { page, limit, total }
      }
    );
  }

  // Transform rate-limited response
  formatRateLimitedResponse<T = any>(
    data: T,
    rateLimitInfo: {
      limit: number;
      remaining: number;
      resetTime: Date;
      windowSize: number;
    },
    operation: string,
    serviceType: string,
    options: ResponseFormatOptions = {}
  ): StandardizedResponse<T> {
    return this.formatSuccess(
      data,
      operation,
      serviceType,
      {
        ...options,
        rateLimit: rateLimitInfo
      }
    );
  }

  // Transform cached response
  formatCachedResponse<T = any>(
    data: T,
    cacheInfo: {
      hit: boolean;
      ttl?: number;
      key?: string;
      source?: string;
    },
    operation: string,
    serviceType: string,
    options: ResponseFormatOptions = {}
  ): StandardizedResponse<T> {
    return this.formatSuccess(
      data,
      operation,
      serviceType,
      {
        ...options,
        cache: cacheInfo
      }
    );
  }

  // Private helper methods

  private generateCorrelationId(): string {
    this.correlationCounter = (this.correlationCounter + 1) % 1000000;
    return `${Date.now()}_${this.correlationCounter.toString().padStart(6, '0')}`;
  }

  private extractErrorCode(error: any): string {
    if (error.code) return error.code;
    if (error.response?.status) return `HTTP_${error.response.status}`;
    if (error.name) return error.name.toUpperCase();
    return 'UNKNOWN_ERROR';
  }

  private extractErrorMessage(error: any): string {
    if (error.message) return error.message;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.statusText) return error.response.statusText;
    return 'An unexpected error occurred';
  }

  private extractErrorDetails(error: any): any {
    return {
      originalError: error.originalError?.message || error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : undefined,
      request: error.config ? {
        method: error.config.method,
        url: error.config.url,
        headers: error.config.headers
      } : undefined
    };
  }

  private extractHttpStatus(error: any): number | undefined {
    return error.httpStatus || error.response?.status;
  }

  private isRetryableError(error: any): boolean {
    if (error.retryable !== undefined) return error.retryable;

    const retryableStatuses = [500, 502, 503, 504, 408, 429];
    const status = this.extractHttpStatus(error);

    if (status && retryableStatuses.includes(status)) return true;

    const retryableCodes = ['TIMEOUT', 'NETWORK_ERROR', 'ECONNRESET', 'ENOTFOUND'];
    const code = this.extractErrorCode(error);

    return retryableCodes.some(retryableCode => code.includes(retryableCode));
  }

  private generateErrorSuggestions(error: any, operation: string, serviceType: string): string[] {
    const suggestions: string[] = [];
    const errorCode = this.extractErrorCode(error);
    const httpStatus = this.extractHttpStatus(error);

    // HTTP status-based suggestions
    if (httpStatus === 401) {
      suggestions.push('Check if authentication credentials are correct');
      suggestions.push('Verify API key or token is valid and not expired');
    } else if (httpStatus === 403) {
      suggestions.push('Verify user has sufficient permissions for this operation');
      suggestions.push('Check if API key has required scopes');
    } else if (httpStatus === 404) {
      suggestions.push('Verify the resource exists and path is correct');
      suggestions.push('Check if the service endpoint is accessible');
    } else if (httpStatus === 429) {
      suggestions.push('Reduce request frequency or implement rate limiting');
      suggestions.push('Wait before retrying the request');
    } else if (httpStatus && httpStatus >= 500) {
      suggestions.push('Check if the service is running and accessible');
      suggestions.push('Try again later as this may be a temporary server issue');
    }

    // Service-specific suggestions
    if (serviceType === 'proxmox') {
      if (errorCode.includes('AUTH')) {
        suggestions.push('Ensure Proxmox API token has correct permissions');
        suggestions.push('Check if the token is not expired (2-hour limit)');
      }
    }

    // Network-related suggestions
    if (errorCode.includes('TIMEOUT')) {
      suggestions.push('Increase timeout configuration');
      suggestions.push('Check network connectivity to the service');
    } else if (errorCode.includes('NETWORK')) {
      suggestions.push('Verify network connectivity');
      suggestions.push('Check firewall and proxy settings');
      suggestions.push('Ensure the service URL is reachable');
    }

    return suggestions;
  }

  private filterFields<T>(data: T[], fields: string[]): T[] {
    return data.map(item => {
      const filtered: any = {};
      fields.forEach(field => {
        if (item && typeof item === 'object' && field in item) {
          filtered[field] = (item as any)[field];
        }
      });
      return filtered;
    });
  }

  private getNodeId(): string {
    return process.env.NODE_ID || 'unknown';
  }

  private getVersion(): string {
    return process.env.npm_package_version || '1.0.0';
  }
}

// Export singleton instance
export const responseFormatter = ResponseFormatter.getInstance();

// Utility functions for common response patterns
export function createSuccessResponse<T = any>(
  data: T,
  operation: string,
  serviceType: string,
  options?: ResponseFormatOptions
): StandardizedResponse<T> {
  return responseFormatter.formatSuccess(data, operation, serviceType, options);
}

export function createErrorResponse(
  error: any,
  operation: string,
  serviceType: string,
  options?: ResponseFormatOptions
): StandardizedResponse<never> {
  return responseFormatter.formatError(error, operation, serviceType, options);
}

export function createPaginatedResponse<T = any>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  operation: string,
  serviceType: string,
  options?: ResponseFormatOptions
): StandardizedResponse<T[]> {
  return responseFormatter.formatPaginatedResponse(
    data,
    total,
    page,
    limit,
    operation,
    serviceType,
    options
  );
}