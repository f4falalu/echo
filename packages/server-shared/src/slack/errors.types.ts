// Custom error class for Slack integration errors
export class SlackError extends Error {
  constructor(
    message: string,
    public statusCode: 500 | 400 | 401 | 403 | 404 | 409 | 429 | 503 = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'SlackError';
  }

  toResponse() {
    return {
      error: this.message,
      code: this.code,
    };
  }
}

// Common error codes
export const SlackErrorCodes = {
  INTEGRATION_NOT_CONFIGURED: 'INTEGRATION_NOT_CONFIGURED',
  INTEGRATION_DISABLED: 'INTEGRATION_DISABLED',
  INTEGRATION_EXISTS: 'INTEGRATION_EXISTS',
  INTEGRATION_NOT_FOUND: 'INTEGRATION_NOT_FOUND',
  OAUTH_INIT_ERROR: 'OAUTH_INIT_ERROR',
  GET_INTEGRATION_ERROR: 'GET_INTEGRATION_ERROR',
  REMOVE_INTEGRATION_ERROR: 'REMOVE_INTEGRATION_ERROR',
  UPDATE_DEFAULT_CHANNEL_ERROR: 'UPDATE_DEFAULT_CHANNEL_ERROR',
  INVALID_REQUEST_BODY: 'INVALID_REQUEST_BODY',
  TOKEN_RETRIEVAL_ERROR: 'TOKEN_RETRIEVAL_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  RATE_LIMITED: 'RATE_LIMITED',
  GET_CHANNELS_ERROR: 'GET_CHANNELS_ERROR',
} as const;

export type SlackErrorCode = (typeof SlackErrorCodes)[keyof typeof SlackErrorCodes];
