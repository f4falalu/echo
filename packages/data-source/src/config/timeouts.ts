/**
 * Standardized timeout configurations for database operations
 * Optimized for serverless environments (Lambda, Trigger.dev)
 */

export const TIMEOUT_CONFIG = {
  // Connection timeouts
  connection: {
    acquisition: 15000, // 15 seconds - time to acquire/create a connection (increased for queue handling)
    health: 3000, // 3 seconds - health check timeout
    total: 30000, // 30 seconds - total connection timeout
  },

  // Query execution timeouts
  query: {
    validation: 120000, // 120 seconds (2 minutes) - for validation queries
    standard: 120000, // 120 seconds (2 minutes) - for standard queries
    extended: 180000, // 180 seconds (3 minutes) - for complex queries
    default: 120000, // 120 seconds (2 minutes) - default timeout
  },

  // Retry configuration
  retry: {
    maxAttempts: 3, // Maximum retry attempts
    delays: [1000, 3000, 6000], // Exponential backoff: 1s, 3s, 6s
    timeout: {
      multiplier: 1.5, // Multiply timeout by this on each retry
      max: 180000, // Maximum timeout after retries: 180 seconds (3 minutes)
    },
  },

  // Serverless-specific
  serverless: {
    maxTotalTime: 150000, // 150 seconds (2.5 minutes) - max total time for serverless including retries
    connectionReuse: 300000, // 5 minutes - how long to keep connections warm
  },
} as const;

/**
 * Get timeout for a specific operation type
 */
export function getOperationTimeout(
  operationType: 'validation' | 'standard' | 'extended' | 'connection',
  isServerless = false
): number {
  if (isServerless && operationType !== 'connection') {
    // In serverless, cap all query timeouts to ensure completion
    return Math.min(
      TIMEOUT_CONFIG.query[operationType] || TIMEOUT_CONFIG.query.default,
      TIMEOUT_CONFIG.serverless.maxTotalTime
    );
  }

  switch (operationType) {
    case 'connection':
      return TIMEOUT_CONFIG.connection.acquisition;
    case 'validation':
      return TIMEOUT_CONFIG.query.validation;
    case 'standard':
      return TIMEOUT_CONFIG.query.standard;
    case 'extended':
      return TIMEOUT_CONFIG.query.extended;
    default:
      return TIMEOUT_CONFIG.query.default;
  }
}

/**
 * Calculate timeout for retry attempt
 */
export function getRetryTimeout(attemptNumber: number, baseTimeout: number): number {
  const multiplier = TIMEOUT_CONFIG.retry.timeout.multiplier ** attemptNumber;
  const timeout = Math.round(baseTimeout * multiplier);
  return Math.min(timeout, TIMEOUT_CONFIG.retry.timeout.max);
}

/**
 * Get delay before retry attempt
 */
export function getRetryDelay(attemptNumber: number): number {
  const delay = TIMEOUT_CONFIG.retry.delays[attemptNumber];
  if (delay !== undefined) {
    return delay;
  }
  // Return the last delay in the array as fallback
  const lastDelay = TIMEOUT_CONFIG.retry.delays[TIMEOUT_CONFIG.retry.delays.length - 1];
  return lastDelay !== undefined ? lastDelay : 6000; // Fallback to 6s if something goes wrong
}
