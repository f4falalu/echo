import { S3Client } from '@aws-sdk/client-s3';
import type { R2Config } from '../types';
import { S3Provider } from './s3-provider';

/**
 * Cloudflare R2 provider
 * R2 is S3-compatible, so we extend S3Provider with R2-specific configuration
 */
export class R2Provider extends S3Provider {
  constructor(config: R2Config) {
    // Create S3-compatible configuration for R2
    const s3Config = {
      provider: 's3' as const,
      region: 'auto', // R2 uses 'auto' region
      bucket: config.bucket,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    };

    // Call parent constructor with S3 config
    super(s3Config);

    // Override the client with R2-specific endpoint
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Required for R2
    });
  }

  // All methods inherited from S3Provider work with R2
  // No need to override unless R2-specific behavior is needed
}
