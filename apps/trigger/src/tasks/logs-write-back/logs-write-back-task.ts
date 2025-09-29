import { createAdapter } from '@buster/data-source';
import type { SnowflakeAdapter } from '@buster/data-source';
import { getDb } from '@buster/database/connection';
import { getDataSourceCredentials, getLogsWriteBackConfig } from '@buster/database/queries';
import { chats, dataSources, messages, users } from '@buster/database/schema';
import {
  type LogsWritebackTaskInput,
  LogsWritebackTaskInputSchema,
  type LogsWritebackTaskOutput,
} from '@buster/server-shared';
import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { eq } from 'drizzle-orm';

/**
 * Logs Write-Back Task
 *
 * This task writes Buster query logs to the customer's Snowflake instance
 * after message post-processing is complete.
 */
export const logsWriteBackTask: ReturnType<
  typeof schemaTask<'logs-write-back', typeof LogsWritebackTaskInputSchema, LogsWritebackTaskOutput>
> = schemaTask<'logs-write-back', typeof LogsWritebackTaskInputSchema, LogsWritebackTaskOutput>({
  id: 'logs-write-back',
  schema: LogsWritebackTaskInputSchema,
  maxDuration: 60, // 1 minute timeout
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: LogsWritebackTaskInput): Promise<LogsWritebackTaskOutput> => {
    const startTime = Date.now();

    try {
      logger.log('Starting logs write-back task', {
        messageId: payload.messageId,
        organizationId: payload.organizationId,
      });

      // Get the logs writeback configuration
      const config = await getLogsWriteBackConfig(payload.organizationId);

      if (!config) {
        logger.log('No logs writeback configuration found', {
          messageId: payload.messageId,
          organizationId: payload.organizationId,
        });
        return {
          success: true,
          messageId: payload.messageId,
          error: {
            code: 'NO_CONFIG',
            message: 'No logs writeback configuration found',
          },
        };
      }

      // Get message data with user info and post-processing results
      const db = getDb();
      const [messageData] = await db
        .select({
          messageId: messages.id,
          chatId: messages.chatId,
          requestMessage: messages.requestMessage,
          createdAt: messages.createdAt,
          updatedAt: messages.updatedAt,
          postProcessingMessage: messages.postProcessingMessage,
          userId: chats.createdBy,
          userEmail: users.email,
          userName: users.name,
        })
        .from(messages)
        .leftJoin(chats, eq(messages.chatId, chats.id))
        .leftJoin(users, eq(chats.createdBy, users.id))
        .where(eq(messages.id, payload.messageId))
        .limit(1);

      if (!messageData) {
        logger.error('Message not found', {
          messageId: payload.messageId,
        });
        return {
          success: false,
          messageId: payload.messageId,
          error: {
            code: 'MESSAGE_NOT_FOUND',
            message: 'Message not found',
          },
        };
      }

      // Calculate duration in seconds
      const createdAt = new Date(messageData.createdAt);
      const updatedAt = new Date(messageData.updatedAt);
      const durationSeconds = Math.floor((updatedAt.getTime() - createdAt.getTime()) / 1000);

      // Extract post-processing data
      const postProcessing = messageData.postProcessingMessage as any;
      const confidenceScore = postProcessing?.confidence_score || 'unknown';
      const assumptions = postProcessing?.assumptions || [];

      // Generate chat link
      const chatLink = `https://platform.buster.so/app/chats/${messageData.chatId}`;

      // Get data source credentials
      const [dataSource] = await db
        .select({
          secretId: dataSources.secretId,
          type: dataSources.type,
        })
        .from(dataSources)
        .where(eq(dataSources.id, config.dataSourceId))
        .limit(1);

      if (!dataSource || dataSource.type !== 'Snowflake') {
        logger.error('Invalid data source', {
          messageId: payload.messageId,
          dataSourceId: config.dataSourceId,
        });
        return {
          success: false,
          messageId: payload.messageId,
          error: {
            code: 'INVALID_DATA_SOURCE',
            message: 'Data source not found or not Snowflake type',
          },
        };
      }

      // Get credentials from vault
      const credentials = await getDataSourceCredentials({
        dataSourceId: config.dataSourceId,
      });

      if (!credentials) {
        logger.error('Failed to retrieve credentials', {
          messageId: payload.messageId,
          dataSourceId: config.dataSourceId,
        });
        return {
          success: false,
          messageId: payload.messageId,
          error: {
            code: 'CREDENTIALS_ERROR',
            message: 'Failed to retrieve data source credentials',
          },
        };
      }

      // Create Snowflake adapter and write the log
      const adapter = (await createAdapter(credentials as any)) as SnowflakeAdapter;

      try {
        await adapter.initialize(credentials as any);

        // Insert the log record
        await adapter.insertLogRecord(config.database, config.schema, config.tableName, {
          messageId: messageData.messageId,
          userEmail: messageData.userEmail || 'unknown',
          userName: messageData.userName || 'unknown',
          chatId: messageData.chatId,
          chatLink: chatLink,
          requestMessage: messageData.requestMessage || '',
          createdAt: createdAt,
          durationSeconds: durationSeconds,
          confidenceScore: confidenceScore,
          assumptions: assumptions,
        });

        logger.log('Log record successfully written to Snowflake', {
          messageId: payload.messageId,
          database: config.database,
          schema: config.schema,
          table: config.tableName,
          durationSeconds,
        });

        return {
          success: true,
          messageId: payload.messageId,
        };
      } finally {
        // Always close the adapter connection
        await adapter.close();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Logs write-back task failed', {
        messageId: payload.messageId,
        organizationId: payload.organizationId,
        error: errorMessage,
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: false,
        messageId: payload.messageId,
        error: {
          code: 'WRITEBACK_FAILED',
          message: errorMessage,
          details: {
            organizationId: payload.organizationId,
            executionTimeMs: Date.now() - startTime,
          },
        },
      };
    }
  },
});

export type LogsWriteBackTask = typeof logsWriteBackTask;
