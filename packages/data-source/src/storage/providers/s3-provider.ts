import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BaseStorageProvider } from '../storage-provider';
import type {
  ConnectionTestResult,
  DownloadResult,
  ListOptions,
  S3Config,
  StorageObject,
  UploadOptions,
  UploadResult,
} from '../types';

export class S3Provider extends BaseStorageProvider {
  protected client: S3Client;

  constructor(config: S3Config) {
    super(config.bucket);

    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(key: string, data: Buffer | string, options?: UploadOptions): Promise<UploadResult> {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      const buffer = this.toBuffer(data);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: sanitizedKey,
        Body: buffer,
        ContentType: options?.contentType,
        ContentDisposition: options?.contentDisposition,
        Metadata: options?.metadata,
      });

      const response = await this.client.send(command);

      return {
        success: true,
        key: sanitizedKey,
        etag: response.ETag || '',
        size: buffer.length,
      };
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

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: sanitizedKey,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        return {
          success: false,
          error: 'No data returned from S3',
        };
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const stream = response.Body as AsyncIterable<Uint8Array>;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      return {
        success: true,
        data: buffer,
        contentType: response.ContentType || 'application/octet-stream',
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

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: sanitizedKey,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  async delete(key: string): Promise<boolean> {
    try {
      const sanitizedKey = this.sanitizeKey(key);

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: sanitizedKey,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const sanitizedKey = this.sanitizeKey(key);

      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: sanitizedKey,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async list(prefix: string, options?: ListOptions): Promise<StorageObject[]> {
    try {
      const sanitizedPrefix = this.sanitizeKey(prefix);

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: sanitizedPrefix,
        MaxKeys: options?.maxKeys,
        ContinuationToken: options?.continuationToken,
      });

      const response = await this.client.send(command);

      return (response.Contents || []).map((object) => ({
        key: object.Key || '',
        size: object.Size || 0,
        lastModified: object.LastModified || new Date(),
        etag: object.ETag || '',
      }));
    } catch (error) {
      console.error('S3 list error:', error);
      return [];
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const testKey = `_test_${Date.now()}.txt`;
    const testData = 'test';

    try {
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

      // Test read
      const downloadResult = await this.download(testKey);
      if (!downloadResult.success) {
        return {
          success: false,
          canRead: false,
          canWrite: true,
          canDelete: false,
          error: `Cannot read from bucket: ${downloadResult.error}`,
        };
      }

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

      return {
        success: true,
        canRead: true,
        canWrite: true,
        canDelete: true,
      };
    } catch (error) {
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
