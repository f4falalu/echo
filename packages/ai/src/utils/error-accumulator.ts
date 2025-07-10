import { wrapTraced } from 'braintrust';

export type ErrorType = 'silent' | 'retry' | 'critical' | 'warning';

export interface AccumulatedError {
  type: ErrorType;
  context: string;
  error: Error | unknown;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ErrorSummary {
  totalErrors: number;
  silentFailures: number;
  criticalErrors: number;
  retryErrors: number;
  warnings: number;
  errors: AccumulatedError[];
  errorsByContext: Record<string, AccumulatedError[]>;
}

/**
 * Accumulates errors throughout a workflow execution
 * Provides visibility into silent failures and error patterns
 */
export class ErrorAccumulator {
  private errors: AccumulatedError[] = [];
  private startTime: number;
  private workflowId?: string;
  private messageId?: string;

  constructor(workflowId?: string, messageId?: string) {
    this.startTime = Date.now();
    if (workflowId) {
      this.workflowId = workflowId;
    }
    if (messageId) {
      this.messageId = messageId;
    }
  }

  /**
   * Add a silent failure (error that doesn't stop execution)
   */
  addSilentFailure(context: string, error: Error | unknown, metadata?: Record<string, unknown>) {
    this.addError('silent', context, error, metadata);
  }

  /**
   * Add a critical error (error that stops execution)
   */
  addCriticalError(context: string, error: Error | unknown, metadata?: Record<string, unknown>) {
    this.addError('critical', context, error, metadata);
  }

  /**
   * Add a retry error (error that triggers a retry)
   */
  addRetryError(context: string, error: Error | unknown, metadata?: Record<string, unknown>) {
    this.addError('retry', context, error, metadata);
  }

  /**
   * Add a warning (non-error condition that should be noted)
   */
  addWarning(context: string, error: Error | unknown, metadata?: Record<string, unknown>) {
    this.addError('warning', context, error, metadata);
  }

  private addError(
    type: ErrorType,
    context: string,
    error: Error | unknown,
    metadata?: Record<string, unknown>
  ) {
    const accumulatedError: AccumulatedError = {
      type,
      context,
      error,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        workflowId: this.workflowId,
        messageId: this.messageId,
        elapsedTime: Date.now() - this.startTime,
      },
    };

    this.errors.push(accumulatedError);

    // Log based on type
    const logMessage = `[ErrorAccumulator] ${type.toUpperCase()} in ${context}`;
    const logData = {
      type,
      context,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      metadata: accumulatedError.metadata,
    };

    switch (type) {
      case 'critical':
        console.error(logMessage, logData);
        break;
      case 'silent':
      case 'retry':
        console.warn(logMessage, logData);
        break;
      case 'warning':
        console.info(logMessage, logData);
        break;
    }
  }

  /**
   * Get a summary of all accumulated errors
   */
  getSummary(): ErrorSummary {
    const errorsByContext: Record<string, AccumulatedError[]> = {};

    // Group errors by context
    for (const error of this.errors) {
      if (!errorsByContext[error.context]) {
        errorsByContext[error.context] = [];
      }
      errorsByContext[error.context]?.push(error);
    }

    return {
      totalErrors: this.errors.length,
      silentFailures: this.errors.filter((e) => e.type === 'silent').length,
      criticalErrors: this.errors.filter((e) => e.type === 'critical').length,
      retryErrors: this.errors.filter((e) => e.type === 'retry').length,
      warnings: this.errors.filter((e) => e.type === 'warning').length,
      errors: this.errors,
      errorsByContext,
    };
  }

  /**
   * Get errors of a specific type
   */
  getErrorsByType(type: ErrorType): AccumulatedError[] {
    return this.errors.filter((e) => e.type === type);
  }

  /**
   * Get errors for a specific context
   */
  getErrorsByContext(context: string): AccumulatedError[] {
    return this.errors.filter((e) => e.context === context);
  }

  /**
   * Check if there are any critical errors
   */
  hasCriticalErrors(): boolean {
    return this.errors.some((e) => e.type === 'critical');
  }

  /**
   * Check if there are any silent failures
   */
  hasSilentFailures(): boolean {
    return this.errors.some((e) => e.type === 'silent');
  }

  /**
   * Clear all accumulated errors
   */
  clear() {
    this.errors = [];
  }

  /**
   * Get a formatted error report
   */
  getReport(): string {
    const summary = this.getSummary();

    if (summary.totalErrors === 0) {
      return 'No errors accumulated during workflow execution.';
    }

    let report = `Error Report (Workflow: ${this.workflowId || 'unknown'})\n`;
    report += `Total Errors: ${summary.totalErrors}\n`;
    report += `- Critical: ${summary.criticalErrors}\n`;
    report += `- Silent Failures: ${summary.silentFailures}\n`;
    report += `- Retries: ${summary.retryErrors}\n`;
    report += `- Warnings: ${summary.warnings}\n\n`;

    // Group by context
    report += 'Errors by Context:\n';
    for (const [context, errors] of Object.entries(summary.errorsByContext)) {
      report += `\n${context} (${errors.length} errors):\n`;
      for (const error of errors) {
        const errorMsg = error.error instanceof Error ? error.error.message : String(error.error);
        report += `  - [${error.type}] ${errorMsg}\n`;
      }
    }

    return report;
  }

  /**
   * Send error telemetry (can be extended to send to monitoring service)
   */
  async sendTelemetry() {
    const summary = this.getSummary();

    // Log summary for now (can be extended to send to monitoring service)
    const telemetryData = {
      workflowId: this.workflowId,
      messageId: this.messageId,
      duration: Date.now() - this.startTime,
      errorSummary: {
        total: summary.totalErrors,
        critical: summary.criticalErrors,
        silent: summary.silentFailures,
        retry: summary.retryErrors,
        warnings: summary.warnings,
      },
      topContexts: Object.entries(summary.errorsByContext)
        .sort(([, a], [, b]) => b.length - a.length)
        .slice(0, 5)
        .map(([context, errors]) => ({ context, count: errors.length })),
    };

    console.info('[ErrorAccumulator] Telemetry:', telemetryData);

    // TODO: Send to monitoring service (e.g., DataDog, CloudWatch, etc.)
    return telemetryData;
  }
}

/**
 * Create a wrapped error accumulator with tracing
 */
export const createErrorAccumulator = wrapTraced(
  (workflowId?: string, messageId?: string) => {
    return new ErrorAccumulator(workflowId, messageId);
  },
  { name: 'create-error-accumulator' }
);
