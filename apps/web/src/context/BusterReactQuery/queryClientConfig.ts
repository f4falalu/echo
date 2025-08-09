export const PREFETCH_STALE_TIME = 1000 * 60 * 1; // 1 minutes
export const ERROR_RETRY_DELAY = 1 * 1000; // 1 second delay after error
export const GC_TIME = 1000 * 60 * 5; // 5 minutes - matches new persistence duration
export const USER_CANCELLED_ERROR = new Error('User cancelled');
