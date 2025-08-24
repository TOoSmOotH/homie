import { AdapterError } from '../../types/adapter.types';
import { logger } from '../../utils/logger';

// Circuit breaker states
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures to open circuit
  resetTimeout: number; // Time in ms to wait before trying half-open
  monitoringWindow: number; // Time window in ms to count failures
  successThreshold: number; // Number of successes to close circuit from half-open
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // Base delay in ms
  maxDelay: number; // Maximum delay in ms
  backoffMultiplier: number; // Exponential backoff multiplier
  retryableErrors: string[]; // Error codes that should be retried
}

// Rate limiter configuration
export interface RateLimiterConfig {
  requestsPerSecond: number;
  burstLimit?: number;
  windowSize: number; // Time window in ms
}

// Resilience manager class
export class ResilienceManager {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private failureCounts: Map<string, number> = new Map();
  private lastFailureTimes: Map<string, number> = new Map();
  private consecutiveSuccesses: Map<string, number> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private windowStartTimes: Map<string, number> = new Map();

  // Execute operation with circuit breaker
  async executeWithCircuitBreaker<T>(
    operationId: string,
    operation: () => Promise<T>,
    config: CircuitBreakerConfig
  ): Promise<T> {
    const state = this.getCircuitBreakerState(operationId);

    if (state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset(operationId, config.resetTimeout)) {
        this.setCircuitBreakerState(operationId, CircuitBreakerState.HALF_OPEN);
        logger.info(`Circuit breaker for ${operationId} moving to half-open state`);
      } else {
        throw new Error(`Circuit breaker is OPEN for operation: ${operationId}`);
      }
    }

    try {
      const result = await operation();
      this.recordSuccess(operationId, config);
      return result;
    } catch (error) {
      this.recordFailure(operationId, config, error);
      throw error;
    }
  }

  // Execute operation with retry logic
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    operationId?: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === config.maxRetries) {
          logger.error(`Operation failed after ${config.maxRetries} retries`, {
            operationId,
            error: lastError.message
          });
          throw lastError;
        }

        if (!this.isRetryableError(error as AdapterError, config.retryableErrors)) {
          logger.warn(`Non-retryable error encountered`, {
            operationId,
            error: lastError.message
          });
          throw lastError;
        }

        const delay = this.calculateRetryDelay(attempt, config);
        logger.warn(`Operation failed, retrying in ${delay}ms`, {
          operationId,
          attempt: attempt + 1,
          maxRetries: config.maxRetries,
          error: lastError.message
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  // Execute operation with rate limiting
  async executeWithRateLimit<T>(
    operationId: string,
    operation: () => Promise<T>,
    config: RateLimiterConfig
  ): Promise<T> {
    this.enforceRateLimit(operationId, config);
    return operation();
  }

  // Execute operation with all resilience patterns
  async executeResilient<T>(
    operationId: string,
    operation: () => Promise<T>,
    options: {
      circuitBreaker?: CircuitBreakerConfig;
      retry?: RetryConfig;
      rateLimit?: RateLimiterConfig;
    } = {}
  ): Promise<T> {
    const { circuitBreaker, retry, rateLimit } = options;

    const resilientOperation = async (): Promise<T> => {
      let result = operation;

      // Apply rate limiting
      if (rateLimit) {
        result = () => this.executeWithRateLimit(operationId, operation, rateLimit);
      }

      // Apply circuit breaker
      if (circuitBreaker) {
        result = () => this.executeWithCircuitBreaker(operationId, result, circuitBreaker);
      }

      return result();
    };

    // Apply retry logic at the top level
    if (retry) {
      return this.executeWithRetry(resilientOperation, retry, operationId);
    }

    return resilientOperation();
  }

  // Get circuit breaker state
  private getCircuitBreakerState(operationId: string): CircuitBreakerState {
    return this.circuitBreakers.get(operationId) || CircuitBreakerState.CLOSED;
  }

  // Set circuit breaker state
  private setCircuitBreakerState(operationId: string, state: CircuitBreakerState): void {
    this.circuitBreakers.set(operationId, state);

    if (state === CircuitBreakerState.CLOSED) {
      this.failureCounts.set(operationId, 0);
      this.consecutiveSuccesses.set(operationId, 0);
    } else if (state === CircuitBreakerState.HALF_OPEN) {
      this.consecutiveSuccesses.set(operationId, 0);
    }
  }

  // Check if circuit breaker should attempt reset
  private shouldAttemptReset(operationId: string, resetTimeout: number): boolean {
    const lastFailure = this.lastFailureTimes.get(operationId);
    if (!lastFailure) return true;

    return Date.now() - lastFailure >= resetTimeout;
  }

  // Record successful operation
  private recordSuccess(operationId: string, config: CircuitBreakerConfig): void {
    const state = this.getCircuitBreakerState(operationId);

    if (state === CircuitBreakerState.HALF_OPEN) {
      const successes = (this.consecutiveSuccesses.get(operationId) || 0) + 1;
      this.consecutiveSuccesses.set(operationId, successes);

      if (successes >= config.successThreshold) {
        this.setCircuitBreakerState(operationId, CircuitBreakerState.CLOSED);
        logger.info(`Circuit breaker for ${operationId} closed after ${successes} successes`);
      }
    } else if (state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success
      this.failureCounts.set(operationId, 0);
    }
  }

  // Record failed operation
  private recordFailure(operationId: string, config: CircuitBreakerConfig, error: any): void {
    const state = this.getCircuitBreakerState(operationId);
    this.lastFailureTimes.set(operationId, Date.now());

    if (state === CircuitBreakerState.CLOSED) {
      const failures = (this.failureCounts.get(operationId) || 0) + 1;
      this.failureCounts.set(operationId, failures);

      if (failures >= config.failureThreshold) {
        this.setCircuitBreakerState(operationId, CircuitBreakerState.OPEN);
        logger.warn(`Circuit breaker for ${operationId} opened after ${failures} failures`);
      }
    } else if (state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in half-open immediately opens the circuit
      this.setCircuitBreakerState(operationId, CircuitBreakerState.OPEN);
      logger.warn(`Circuit breaker for ${operationId} opened during half-open state`);
    }
  }

  // Check if error is retryable
  private isRetryableError(error: AdapterError, retryableErrors: string[]): boolean {
    if (!error.retryable) return false;

    if (retryableErrors.length === 0) return true;

    return retryableErrors.some(code =>
      error.code.includes(code) || error.message.includes(code)
    );
  }

  // Calculate retry delay with exponential backoff
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
      config.maxDelay
    );

    // Add jitter to prevent thundering herd
    return delay * (0.5 + Math.random() * 0.5);
  }

  // Enforce rate limiting
  private enforceRateLimit(operationId: string, config: RateLimiterConfig): void {
    const now = Date.now();
    const windowStart = this.windowStartTimes.get(operationId);
    const requestCount = this.requestCounts.get(operationId) || 0;

    // Reset window if needed
    if (!windowStart || now - windowStart >= config.windowSize) {
      this.windowStartTimes.set(operationId, now);
      this.requestCounts.set(operationId, 1);
      return;
    }

    // Check rate limit
    const timeElapsed = now - windowStart;
    const currentRate = (requestCount / timeElapsed) * 1000; // requests per second

    if (currentRate >= config.requestsPerSecond) {
      const waitTime = Math.ceil((requestCount / config.requestsPerSecond) * 1000 - timeElapsed);
      logger.warn(`Rate limit exceeded for ${operationId}, waiting ${waitTime}ms`);
      throw new Error(`Rate limit exceeded. Try again in ${waitTime}ms`);
    }

    // Check burst limit
    if (config.burstLimit && requestCount >= config.burstLimit) {
      throw new Error(`Burst limit of ${config.burstLimit} exceeded`);
    }

    this.requestCounts.set(operationId, requestCount + 1);
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get resilience metrics for monitoring
  getMetrics(operationId: string): {
    circuitBreakerState: CircuitBreakerState;
    failureCount: number;
    consecutiveSuccesses: number;
    requestCount: number;
    lastFailureTime?: number;
  } {
    return {
      circuitBreakerState: this.getCircuitBreakerState(operationId),
      failureCount: this.failureCounts.get(operationId) || 0,
      consecutiveSuccesses: this.consecutiveSuccesses.get(operationId) || 0,
      requestCount: this.requestCounts.get(operationId) || 0,
      lastFailureTime: this.lastFailureTimes.get(operationId)
    };
  }

  // Reset all resilience state for an operation
  resetOperation(operationId: string): void {
    this.circuitBreakers.delete(operationId);
    this.failureCounts.delete(operationId);
    this.lastFailureTimes.delete(operationId);
    this.consecutiveSuccesses.delete(operationId);
    this.requestCounts.delete(operationId);
    this.windowStartTimes.delete(operationId);

    logger.info(`Reset resilience state for operation: ${operationId}`);
  }

  // Reset all operations
  resetAll(): void {
    this.circuitBreakers.clear();
    this.failureCounts.clear();
    this.lastFailureTimes.clear();
    this.consecutiveSuccesses.clear();
    this.requestCounts.clear();
    this.windowStartTimes.clear();

    logger.info('Reset all resilience states');
  }
}

// Default configurations
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringWindow: 60000, // 1 minute
  successThreshold: 3
};

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: ['HTTP_500', 'HTTP_502', 'HTTP_503', 'HTTP_504', 'TIMEOUT', 'NETWORK_ERROR']
};

export const DEFAULT_RATE_LIMITER_CONFIG: RateLimiterConfig = {
  requestsPerSecond: 10,
  burstLimit: 20,
  windowSize: 60000 // 1 minute
};

// Singleton instance
export const resilienceManager = new ResilienceManager();