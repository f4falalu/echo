import { randomBytes } from 'node:crypto';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createAdapter } from '@buster/data-source';
import type { Credentials } from '@buster/data-source';
import { getDataSourceCredentials, getMetricForExport } from '@buster/database';
import { logger, schemaTask } from '@trigger.dev/sdk';
import { convertToCSV, estimateCSVSize } from './csv-helpers';
import {
  type ExportMetricDataInput,
  ExportMetricDataInputSchema,
  type ExportMetricDataOutput,
} from './interfaces';

// Validate required environment variables
if (!process.env.R2_ACCOUNT_ID) {
  throw new Error('R2_ACCOUNT_ID environment variable is missing');
}
if (!process.env.R2_ACCESS_KEY_ID) {
  throw new Error('R2_ACCESS_KEY_ID environment variable is missing');
}
if (!process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error('R2_SECRET_ACCESS_KEY environment variable is missing');
}

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const R2_BUCKET = process.env.R2_BUCKET || 'metric-exports';
const MAX_ROWS = 1000000; // 1 million row limit for safety
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB max file size

/**
 * Task for exporting metric data to CSV and generating a presigned download URL
 *
 * This task:
 * 1. Fetches metric configuration and validates user access
 * 2. Retrieves data source credentials from vault
 * 3. Executes the metric's SQL query
 * 4. Converts results to CSV format
 * 5. Uploads to R2 storage
 * 6. Generates a 60-second presigned URL for download
 * 7. Schedules cleanup after 60 seconds
 */
export const exportMetricData: ReturnType<
  typeof schemaTask<
    'export-metric-data',
    typeof ExportMetricDataInputSchema,
    ExportMetricDataOutput
  >
> = schemaTask({
  id: 'export-metric-data',
  schema: ExportMetricDataInputSchema,
  machine: {
    preset: 'large-1x', // 4 vCPU, 8GB RAM for handling large datasets
  },
  maxDuration: 300, // 5 minutes max
  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 5000,
    factor: 2,
  },
  run: async (payload): Promise<ExportMetricDataOutput> => {
    const startTime = Date.now();

    try {
      logger.log('Starting metric export', {
        metricId: payload.metricId,
        userId: payload.userId,
        organizationId: payload.organizationId,
      });

      // Step 1: Fetch metric details and validate access
      const metric = await getMetricForExport({ metricId: payload.metricId });

      // Validate organization access
      if (metric.organizationId !== payload.organizationId) {
        logger.error('Unauthorized access attempt', {
          metricId: payload.metricId,
          metricOrgId: metric.organizationId,
          requestOrgId: payload.organizationId,
        });

        return {
          success: false,
          error: 'You do not have permission to export this metric',
          errorCode: 'UNAUTHORIZED',
        };
      }

      logger.log('Metric validated', {
        metricName: metric.name,
        dataSourceId: metric.dataSourceId,
      });

      // Step 2: Get data source credentials from vault
      let credentials: Credentials;

      try {
        const rawCredentials = await getDataSourceCredentials({
          dataSourceId: metric.dataSourceId,
        });

        // Ensure credentials have the correct type
        credentials = {
          ...rawCredentials,
          type: rawCredentials.type || metric.dataSourceType,
        } as Credentials;
      } catch (error) {
        logger.error('Failed to retrieve data source credentials', {
          error: error instanceof Error ? error.message : 'Unknown error',
          dataSourceId: metric.dataSourceId,
        });

        return {
          success: false,
          error: 'Failed to access data source credentials',
          errorCode: 'NOT_FOUND',
        };
      }

      // Step 3: Execute query using data source adapter
      logger.log('Executing metric query', { sql: `${metric.sql?.substring(0, 100)}...` });

      const adapter = await createAdapter(credentials);
      let queryResult: Awaited<ReturnType<typeof adapter.query>> | undefined;

      try {
        if (!metric.sql) {
          throw new Error('Metric SQL is missing');
        }
        queryResult = await adapter.query(
          metric.sql,
          [], // No parameters for metric queries
          MAX_ROWS,
          60000 // 60 second query timeout
        );

        logger.log('Query executed successfully', {
          rowCount: queryResult.rowCount,
          fieldCount: queryResult.fields.length,
        });
      } catch (error) {
        logger.error('Query execution failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
          success: false,
          error: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          errorCode: 'QUERY_ERROR',
        };
      } finally {
        // Always close the adapter connection
        await adapter.close().catch((err: unknown) => {
          logger.warn('Failed to close adapter connection', { error: err });
        });
      }

      // Step 4: Convert to CSV
      logger.log('Converting results to CSV');

      const csv = convertToCSV(queryResult.rows, queryResult.fields);
      const csvSize = Buffer.byteLength(csv, 'utf-8');

      // Check file size
      if (csvSize > MAX_FILE_SIZE) {
        logger.error('CSV file too large', {
          size: csvSize,
          maxSize: MAX_FILE_SIZE,
        });

        return {
          success: false,
          error: `File size (${Math.round(csvSize / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`,
          errorCode: 'QUERY_ERROR',
        };
      }

      logger.log('CSV generated', {
        size: csvSize,
        rowCount: queryResult.rowCount,
      });

      // Step 5: Generate unique storage key with security
      const randomId = randomBytes(16).toString('hex');
      const timestamp = Date.now();
      const sanitizedMetricName = metric.name.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
      const fileName = `${sanitizedMetricName}_${timestamp}.csv`;
      const key = `exports/${payload.organizationId}/${payload.metricId}/${timestamp}-${randomId}/${fileName}`;

      // Step 6: Upload to R2
      logger.log('Uploading to R2', { key, bucket: R2_BUCKET });

      try {
        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: csv,
            ContentType: 'text/csv',
            ContentDisposition: `attachment; filename="${fileName}"`,
            Metadata: {
              'metric-id': payload.metricId,
              'user-id': payload.userId,
              'organization-id': payload.organizationId,
              'row-count': String(queryResult.rowCount),
              'created-at': new Date().toISOString(),
              'auto-delete': 'true',
            },
          })
        );

        logger.log('File uploaded successfully');
      } catch (error) {
        logger.error('Upload to R2 failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
          success: false,
          error: 'Failed to upload file to storage',
          errorCode: 'UPLOAD_ERROR',
        };
      }

      // Step 7: Generate presigned URL with 60-second expiry
      let downloadUrl: string;

      try {
        downloadUrl = await getSignedUrl(
          r2Client,
          new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            ResponseContentDisposition: `attachment; filename="${fileName}"`,
          }),
          {
            expiresIn: 60, // 60 seconds
            signableHeaders: new Set(['host']),
          }
        );

        logger.log('Presigned URL generated', { expiresIn: 60 });
      } catch (error) {
        logger.error('Failed to generate presigned URL', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
          success: false,
          error: 'Failed to generate download URL',
          errorCode: 'UNKNOWN',
        };
      }

      // Step 8: Schedule cleanup after 60 seconds (matches URL expiry)
      try {
        const { cleanupExportFile } = await import('./cleanup-export-file');
        await cleanupExportFile.trigger(
          { key },
          { delay: '60s' } // 60 seconds delay
        );

        logger.log('Cleanup scheduled for 60 seconds');
      } catch (error) {
        // Non-critical error, just log
        logger.warn('Failed to schedule cleanup', { error });
      }

      const processingTime = Date.now() - startTime;

      logger.log('Export completed successfully', {
        metricId: payload.metricId,
        processingTime,
        fileSize: csvSize,
        rowCount: queryResult.rowCount,
      });

      return {
        success: true,
        downloadUrl,
        expiresAt: new Date(Date.now() + 60000).toISOString(), // 60 seconds from now
        fileSize: csvSize,
        rowCount: queryResult.rowCount,
        fileName,
      };
    } catch (error) {
      logger.error('Unexpected error during export', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        errorCode: 'UNKNOWN',
      };
    }
  },
});
