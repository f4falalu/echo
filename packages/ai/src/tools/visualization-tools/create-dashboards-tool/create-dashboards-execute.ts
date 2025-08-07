import { updateMessageReasoning } from '@buster/database';
import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import { wrapTraced } from 'braintrust';
import type {
  CreateDashboardsAgentContext,
  CreateDashboardsInput,
  CreateDashboardsOutput,
  CreateDashboardsState,
} from './create-dashboards-tool';
import { createDashboardsReasoningMessage } from './helpers/create-dashboards-tool-transform-helper';

// For now, import and use the existing implementation
import { createDashboards as existingCreateDashboards } from '../create-dashboards-file-tool';

export function createCreateDashboardsExecute<
  TAgentContext extends CreateDashboardsAgentContext = CreateDashboardsAgentContext,
>(context: TAgentContext, state: CreateDashboardsState) {
  return wrapTraced(
    async (input: CreateDashboardsInput): Promise<CreateDashboardsOutput> => {
      const startTime = Date.now();

      try {
        // Delegate to existing tool with context wrapped in experimental_context
        const result = await existingCreateDashboards.execute(input, {
          experimental_context: context,
        });

        // Update state files with final results (IDs, versions, status)
        if (result && typeof result === 'object') {
          const typedResult = result as CreateDashboardsOutput;

          // Update successful files
          if (typedResult.files && Array.isArray(typedResult.files)) {
            typedResult.files.forEach((file) => {
              const stateFile = state.files.find((f) => f.name === file.name);
              if (stateFile) {
                stateFile.id = file.id;
                stateFile.version = file.version_number;
                stateFile.status = 'completed';
              }
            });
          }

          // Update failed files
          if (typedResult.failed_files && Array.isArray(typedResult.failed_files)) {
            typedResult.failed_files.forEach((failedFile) => {
              const stateFile = state.files.find((f) => f.name === failedFile.name);
              if (stateFile) {
                stateFile.status = 'failed';
                stateFile.error = failedFile.error;
              }
            });
          }

          // Create final reasoning entry if context.messageId exists
          if (context.messageId && state.reasoningEntryId) {
            try {
              const finalStatus = typedResult.failed_files?.length ? 'failed' : 'completed';
              const finalReasoningMessage = createDashboardsReasoningMessage(
                state.toolCallId || `tool-${Date.now()}`,
                state.files,
                finalStatus
              );

              await updateMessageReasoning(
                context.messageId,
                state.reasoningEntryId,
                finalReasoningMessage as ChatMessageReasoningMessage
              );

              console.info('[create-dashboards] Updated reasoning entry with final results', {
                messageId: context.messageId,
                reasoningEntryId: state.reasoningEntryId,
                successCount: typedResult.files?.length || 0,
                failedCount: typedResult.failed_files?.length || 0,
              });
            } catch (error) {
              console.error('[create-dashboards] Error updating final reasoning entry:', error);
              // Don't throw - return the result anyway
            }
          }
        }

        const executionTime = Date.now() - startTime;
        console.info('[create-dashboards] Execution completed', {
          executionTime: `${executionTime}ms`,
          filesCreated: result?.files?.length || 0,
          filesFailed: result?.failed_files?.length || 0,
        });

        return result as CreateDashboardsOutput;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error('[create-dashboards] Execution failed', {
          error,
          executionTime: `${executionTime}ms`,
        });

        // Update reasoning entry with failure status if possible
        if (context.messageId && state.reasoningEntryId) {
          try {
            const failedReasoningMessage = createDashboardsReasoningMessage(
              state.toolCallId || `tool-${Date.now()}`,
              state.files.map((f) => ({ ...f, status: 'failed' })),
              'failed'
            );

            await updateMessageReasoning(
              context.messageId,
              state.reasoningEntryId,
              failedReasoningMessage as ChatMessageReasoningMessage
            );
          } catch (updateError) {
            console.error(
              '[create-dashboards] Error updating reasoning entry on failure:',
              updateError
            );
          }
        }

        throw error;
      }
    },
    { name: 'create-dashboards-execute' }
  );
}
