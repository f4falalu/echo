import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { logger, task } from '@trigger.dev/sdk';
import { CleanupExportFileInputSchema } from './interfaces';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET || 'metric-exports';

/**
 * Cleanup task to delete export files from R2 storage
 * This serves as a backup to R2's lifecycle rules
 */
export const cleanupExportFile = task({
  id: 'cleanup-export-file',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 5000,
    factor: 2,
  },
  run: async (payload: { key: string }) => {
    const validated = CleanupExportFileInputSchema.parse(payload);

    try {
      logger.log('Cleaning up export file', {
        key: validated.key,
        bucket: R2_BUCKET,
      });

      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: validated.key,
        })
      );

      logger.log('Export file deleted successfully', { key: validated.key });

      return {
        success: true,
        key: validated.key,
      };
    } catch (error) {
      // File might already be deleted by lifecycle rules
      if (error instanceof Error && error.name === 'NoSuchKey') {
        logger.info('File already deleted (likely by lifecycle rule)', {
          key: validated.key,
        });

        return {
          success: true,
          key: validated.key,
          note: 'Already deleted',
        };
      }

      logger.error('Failed to delete export file', {
        key: validated.key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw to trigger retry
      throw error;
    }
  },
});
