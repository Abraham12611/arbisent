import { TradeError, ErrorCategory, ErrorSeverity, RetryConfig, ErrorRecoveryResult } from './types';
import { TradeStatusService } from '../status/service';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
};

export class ErrorRecoveryService {
  private statusService: TradeStatusService;

  constructor() {
    this.statusService = new TradeStatusService();
  }

  createTradeError(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    retryable: boolean = false,
    context?: Record<string, any>,
    originalError?: Error
  ): TradeError {
    const error = new Error(message) as TradeError;
    error.category = category;
    error.severity = severity;
    error.retryable = retryable;
    error.context = context;
    error.originalError = originalError;
    return error;
  }

  classifyError(error: Error): TradeError {
    // Network errors
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return this.createTradeError(
        error.message,
        'network',
        'medium',
        true,
        { timestamp: new Date() },
        error
      );
    }

    // Blockchain errors
    if (
      error.message.includes('gas') ||
      error.message.includes('nonce') ||
      error.message.includes('transaction')
    ) {
      return this.createTradeError(
        error.message,
        'blockchain',
        'high',
        true,
        { timestamp: new Date() },
        error
      );
    }

    // Validation errors
    if (
      error.message.includes('invalid') ||
      error.message.includes('required') ||
      error.message.includes('validation')
    ) {
      return this.createTradeError(
        error.message,
        'validation',
        'low',
        false,
        { timestamp: new Date() },
        error
      );
    }

    // API errors
    if (error.message.includes('API') || error.message.includes('rate limit')) {
      return this.createTradeError(
        error.message,
        'api',
        'medium',
        true,
        { timestamp: new Date() },
        error
      );
    }

    // Default to unknown
    return this.createTradeError(
      error.message,
      'unknown',
      'medium',
      false,
      { timestamp: new Date() },
      error
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateBackoff(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
      config.maxDelay
    );
    // Add some jitter to prevent thundering herd
    return delay * (0.75 + Math.random() * 0.5);
  }

  async retryWithBackoff<T>(
    executionId: string,
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<ErrorRecoveryResult & { data?: T }> {
    let attempts = 0;
    let lastError: TradeError | undefined;

    while (attempts < config.maxAttempts) {
      attempts++;
      try {
        const data = await operation();
        return {
          success: true,
          attempts,
          lastAttemptTime: new Date(),
          data
        };
      } catch (error) {
        const tradeError = this.classifyError(error instanceof Error ? error : new Error(String(error)));
        lastError = tradeError;

        // Update status with error information
        await this.statusService.addStatusUpdate(
          executionId,
          'error',
          `Attempt ${attempts} failed: ${tradeError.message}`,
          {
            category: tradeError.category,
            severity: tradeError.severity,
            attempt: attempts,
            maxAttempts: config.maxAttempts
          }
        );

        if (!tradeError.retryable || attempts >= config.maxAttempts) {
          break;
        }

        const backoffDelay = this.calculateBackoff(attempts, config);
        await this.delay(backoffDelay);

        // Update status before retry
        await this.statusService.addStatusUpdate(
          executionId,
          'info',
          `Retrying operation (attempt ${attempts + 1}/${config.maxAttempts})`,
          { nextAttemptDelay: backoffDelay }
        );
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
      lastAttemptTime: new Date()
    };
  }

  async handleTradeError(
    executionId: string,
    error: Error,
    context?: Record<string, any>
  ): Promise<void> {
    const tradeError = this.classifyError(error);

    // Update execution status
    await this.statusService.updateExecutionStatus(
      executionId,
      'failed',
      {
        error: tradeError.message
      }
    );

    // Add detailed error status update
    await this.statusService.addStatusUpdate(
      executionId,
      'error',
      tradeError.message,
      {
        category: tradeError.category,
        severity: tradeError.severity,
        context: {
          ...tradeError.context,
          ...context
        }
      }
    );
  }
} 