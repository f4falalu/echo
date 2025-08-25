import { getS3IntegrationByOrganizationId, getSecretByName } from '@buster/database';
import type { CreateS3IntegrationRequest } from '@buster/server-shared';
import { GCSProvider } from './providers/gcs-provider';
import { R2Provider } from './providers/r2-provider';
import { S3Provider } from './providers/s3-provider';
import type { StorageConfig, StorageProvider } from './types';

/**
 * Factory for creating storage providers
 */
export class StorageFactory {
  /**
   * Create a storage provider from configuration
   */
  static createProvider(config: StorageConfig): StorageProvider {
    switch (config.provider) {
      case 's3':
        return new S3Provider(config);
      case 'r2':
        return new R2Provider(config);
      case 'gcs':
        return new GCSProvider(config);
      default:
        throw new Error(`Unsupported storage provider: ${(config as any).provider}`);
    }
  }

  /**
   * Get storage provider for an organization
   * Returns customer storage if configured, otherwise returns default R2 storage
   */
  static async getProviderForOrganization(organizationId: string): Promise<StorageProvider> {
    try {
      // Check if organization has a storage integration
      const integration = await getS3IntegrationByOrganizationId(organizationId);

      if (integration) {
        // Get credentials from vault
        const secretName = `s3-integration-${integration.id}`;
        const secret = await getSecretByName(secretName);

        if (secret && secret.secret) {
          // Parse the stored credentials
          const credentials = JSON.parse(secret.secret) as CreateS3IntegrationRequest;

          // Create appropriate config based on provider
          let config: StorageConfig;

          if (credentials.provider === 's3') {
            config = {
              provider: 's3',
              region: credentials.region,
              bucket: credentials.bucket,
              accessKeyId: credentials.accessKeyId,
              secretAccessKey: credentials.secretAccessKey,
            };
          } else if (credentials.provider === 'r2') {
            config = {
              provider: 'r2',
              accountId: credentials.accountId,
              bucket: credentials.bucket,
              accessKeyId: credentials.accessKeyId,
              secretAccessKey: credentials.secretAccessKey,
            };
          } else if (credentials.provider === 'gcs') {
            config = {
              provider: 'gcs',
              projectId: credentials.projectId,
              bucket: credentials.bucket,
              serviceAccountKey: credentials.serviceAccountKey,
            };
          } else {
            throw new Error(`Unknown provider type: ${(credentials as any).provider}`);
          }

          return StorageFactory.createProvider(config);
        }
      }
    } catch (error) {
      console.error('Error getting customer storage integration:', error);
      // Fall back to default storage
    }

    // Return default R2 storage
    return StorageFactory.getDefaultProvider();
  }

  /**
   * Get the default R2 storage provider
   */
  static getDefaultProvider(): StorageProvider {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET || 'metric-exports';

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Default R2 storage credentials not configured');
    }

    const config: StorageConfig = {
      provider: 'r2',
      accountId,
      bucket,
      accessKeyId,
      secretAccessKey,
    };

    return StorageFactory.createProvider(config);
  }

  /**
   * Test storage credentials
   */
  static async testCredentials(config: StorageConfig): Promise<boolean> {
    try {
      const provider = StorageFactory.createProvider(config);
      const result = await provider.testConnection();
      return result.success;
    } catch (error) {
      console.error('Credential test failed:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return false;
    }
  }
}
