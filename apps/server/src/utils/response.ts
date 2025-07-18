import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import type { ErrorResponse } from '../types/errors.types';

export const errorResponse = (
  message: string | Error | unknown,
  status: 500 | 400 | 401 | 403 | 404 | 409 | 500 = 400
) => {
  const errorMessage =
    typeof message === 'string'
      ? message
      : message instanceof Error
        ? message.message
        : 'Internal server error';
  return new HTTPException(status, {
    message: errorMessage,
  } satisfies ErrorResponse);
};

export const notFoundResponse = (resource = 'Resource') => {
  throw new HTTPException(404, {
    message: `${resource} not found`,
  } satisfies ErrorResponse);
};

export const unauthorizedResponse = (message = 'Unauthorized') => {
  throw new HTTPException(401, {
    message,
  } satisfies ErrorResponse);
};

/**
 * Handles Zod validation errors with detailed issue information
 * Returns a JSON response with validation error details for easier debugging
 */
export const handleZodError = (error: z.ZodError) => {
  return {
    error: 'Validation Error',
    message: 'Invalid request data',
    issues: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
  };
};

/**
 * Standard error handler for Hono routes
 * Handles Zod validation errors, HTTP exceptions, and unexpected errors
 * Returns complete Hono response with detailed error information for easier debugging
 *
 * @param error - The error to handle
 * @param c - Hono context
 * @param customMessage - Optional custom message to use instead of default error message
 */
export const standardErrorHandler = (
  error: Error | z.ZodError | HTTPException | unknown,
  c: Context,
  customMessage?: string
) => {
  // Handle Zod validation errors with detailed information
  if (error instanceof z.ZodError) {
    return c.json(handleZodError(error), 400);
  }

  // Handle HTTP exceptions - let them manage their own response
  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  // Log unexpected errors but still return helpful details
  console.error('Unhandled error:', error);

  return c.json(
    {
      error: 'Internal Server Error',
      message: customMessage || (error instanceof Error ? error.message : 'Unknown error'),
    },
    500
  );
};
