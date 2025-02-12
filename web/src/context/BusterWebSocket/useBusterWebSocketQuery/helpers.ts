import { BusterSocketRequest, BusterSocketResponse } from '@/api/buster_socket';

export const isSocketError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const transformError = (error: unknown): Error => {
  if (isSocketError(error)) {
    return error;
  }
  return new Error('Unknown WebSocket error occurred');
};
