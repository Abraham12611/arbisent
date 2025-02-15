export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 
  | 'network'
  | 'validation'
  | 'blockchain'
  | 'api'
  | 'database'
  | 'authentication'
  | 'unknown';

export interface TradeError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  context?: Record<string, any>;
  originalError?: Error;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface ErrorRecoveryResult {
  success: boolean;
  error?: TradeError;
  attempts: number;
  lastAttemptTime: Date;
} 