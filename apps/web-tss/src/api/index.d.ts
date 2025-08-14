import type { RustApiError } from './errors';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: RustApiError;
  }
}
