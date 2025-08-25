import type {
  ConnectionTestResult,
  DownloadResult,
  ListOptions,
  StorageObject,
  StorageProvider,
  UploadOptions,
  UploadResult,
} from './types';

/**
 * Abstract base class for storage providers
 * Provides common functionality and error handling
 */
export abstract class BaseStorageProvider implements StorageProvider {
  protected bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  abstract upload(
    key: string,
    data: Buffer | string,
    options?: UploadOptions
  ): Promise<UploadResult>;

  abstract download(key: string): Promise<DownloadResult>;

  abstract getSignedUrl(key: string, expiresIn: number): Promise<string>;

  abstract delete(key: string): Promise<boolean>;

  abstract exists(key: string): Promise<boolean>;

  abstract list(prefix: string, options?: ListOptions): Promise<StorageObject[]>;

  abstract testConnection(): Promise<ConnectionTestResult>;

  /**
   * Sanitize storage key to prevent path traversal
   */
  protected sanitizeKey(key: string): string {
    // Remove leading slashes
    key = key.replace(/^\/+/, '');

    // Remove any path traversal attempts
    key = key.replace(/\.\./g, '');

    // Normalize multiple slashes to single slash
    key = key.replace(/\/+/g, '/');

    return key;
  }

  /**
   * Convert string to Buffer if needed
   */
  protected toBuffer(data: Buffer | string): Buffer {
    if (typeof data === 'string') {
      return Buffer.from(data, 'utf-8');
    }
    return data;
  }

  /**
   * Standard error handler for storage operations
   */
  protected handleError(operation: string, error: unknown): never {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Storage ${operation} failed: ${message}`);
  }
}
