import { Storage } from '@google-cloud/storage';
import { BaseStorageProvider } from '../storage-provider';
import type {
  ConnectionTestResult,
  DownloadResult,
  GCSConfig,
  ListOptions,
  StorageObject,
  UploadOptions,
  UploadResult,
} from '../types';

export class GCSProvider extends BaseStorageProvider {
  private storage: Storage;
  private bucketInstance: any; // Using any to avoid complex GCS types

  constructor(config: GCSConfig) {
    super(config.bucket);

    // Parse service account key
    let credentials;
    try {
      credentials = JSON.parse(config.serviceAccountKey);
    } catch (error) {
      throw new Error(`Failed to parse GCS service account key: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }

    try {
      this.storage = new Storage({
        projectId: config.projectId,
        credentials,
      });

      this.bucketInstance = this.storage.bucket(config.bucket);
    } catch (error) {
      throw new Error(`Failed to initialize GCS client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async upload(key: string, data: Buffer | string, options?: UploadOptions): Promise<UploadResult> {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      const buffer = this.toBuffer(data);

      const file = this.bucketInstance.file(sanitizedKey);
      const stream = file.createWriteStream({
        resumable: false,
        metadata: {
          contentType: options?.contentType,
          contentDisposition: options?.contentDisposition,
          metadata: options?.metadata,
        },
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error: any) => {
          resolve({
            success: false,
            key,
            error: error.message,
          });
        });

        stream.on('finish', () => {
          resolve({
            success: true,
            key: sanitizedKey,
            etag: '',
            size: buffer.length,
          });
        });

        stream.end(buffer);
      });
    } catch (error) {
      return {
        success: false,
        key,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async download(key: string): Promise<DownloadResult> {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      const file = this.bucketInstance.file(sanitizedKey);

      const [buffer] = await file.download();
      const [metadata] = await file.getMetadata();

      return {
        success: true,
        data: buffer,
        contentType: metadata.contentType || 'application/octet-stream',
        size: buffer.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const sanitizedKey = this.sanitizeKey(key);
    const file = this.bucketInstance.file(sanitizedKey);

    // Convert seconds to milliseconds and add to current time
    const expires = Date.now() + expiresIn * 1000;

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires,
    });

    return url;
  }

  async delete(key: string): Promise<boolean> {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      const file = this.bucketInstance.file(sanitizedKey);

      await file.delete();
      return true;
    } catch (error) {
      console.error('GCS delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      const file = this.bucketInstance.file(sanitizedKey);

      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error('GCS exists error:', error);
      return false;
    }
  }

  async list(prefix: string, options?: ListOptions): Promise<StorageObject[]> {
    try {
      const sanitizedPrefix = this.sanitizeKey(prefix);

      const [files] = await this.bucketInstance.getFiles({
        prefix: sanitizedPrefix,
        maxResults: options?.maxKeys,
        pageToken: options?.continuationToken,
      });

      return files.map((file: any) => ({
        key: file.name,
        size: Number.parseInt(file.metadata.size || '0', 10),
        lastModified: new Date(file.metadata.updated || file.metadata.timeCreated),
        etag: file.metadata.etag || '',
      }));
    } catch (error) {
      console.error('GCS list error:', error);
      return [];
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const testKey = `_test_${Date.now()}.txt`;
    const testData = 'test';

    try {
      // Test bucket exists
      console.info('GCS: Testing bucket exists for:', this.bucket);
      let exists: boolean;
      try {
        [exists] = await this.bucketInstance.exists();
      } catch (error) {
        console.error('GCS: Error checking bucket existence:', error);
        return {
          success: false,
          canRead: false,
          canWrite: false,
          canDelete: false,
          error: `Failed to check bucket existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
      
      if (!exists) {
        return {
          success: false,
          canRead: false,
          canWrite: false,
          canDelete: false,
          error: 'Bucket does not exist or is not accessible',
        };
      }

      console.info('GCS: Bucket exists, testing write permission');
      // Test write
      const uploadResult = await this.upload(testKey, testData);
      if (!uploadResult.success) {
        return {
          success: false,
          canRead: false,
          canWrite: false,
          canDelete: false,
          error: `Cannot write to bucket: ${uploadResult.error}`,
        };
      }

      console.info('GCS: Write successful, testing read permission');
      // Test read
      const downloadResult = await this.download(testKey);
      if (!downloadResult.success) {
        // Clean up test file
        await this.delete(testKey);
        return {
          success: false,
          canRead: false,
          canWrite: true,
          canDelete: false,
          error: `Cannot read from bucket: ${downloadResult.error}`,
        };
      }

      console.info('GCS: Read successful, testing delete permission');
      // Test delete
      const deleteResult = await this.delete(testKey);
      if (!deleteResult) {
        return {
          success: false,
          canRead: true,
          canWrite: true,
          canDelete: false,
          error: 'Cannot delete from bucket',
        };
      }

      console.info('GCS: All tests passed successfully');
      return {
        success: true,
        canRead: true,
        canWrite: true,
        canDelete: true,
      };
    } catch (error) {
      console.error('GCS: Unexpected error during connection test:', error);
      return {
        success: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }
}
