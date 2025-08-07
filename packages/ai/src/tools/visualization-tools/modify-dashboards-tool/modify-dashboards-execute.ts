import { updateMessageFields } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { createDashboardsReasoningMessage } from './helpers/modify-dashboards-transform-helper';
import type {
  ModifyDashboardsAgentContext,
  ModifyDashboardsInput,
  ModifyDashboardsOutput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

// For now, import and use the existing implementation
import { modifyDashboards as existingModifyDashboards } from '../modify-dashboards-file-tool';

export function createModifyDashboardsExecute<
  TAgentContext extends ModifyDashboardsAgentContext = ModifyDashboardsAgentContext,
>(context: TAgentContext, state: ModifyDashboardsState) {
  return wrapTraced(
    async (input: ModifyDashboardsInput): Promise<ModifyDashboardsOutput> => {
      const startTime = Date.now();
      const messageId = context.messageId;

      // Update state with execution progress
      state.parsedArgs = input;
      state.files = input.files.map((file) => ({
        id: file.id,
        yml_content: file.yml_content,
        status: 'processing' as const,
      }));

      // Delegate to existing tool with context wrapped in experimental_context
      const result = await existingModifyDashboards.execute(input, {
        experimental_context: context,
      });

      // Update state files with final results
      if (result.files) {
        result.files.forEach((file) => {
          const stateFile = state.files.find((f) => f.id === file.id);
          if (stateFile) {
            stateFile.status = 'completed';
            stateFile.name = file.name;
            stateFile.version = file.version_number;
          }
        });
      }

      if (result.failed_files) {
        result.failed_files.forEach((failedFile) => {
          // Try to match by name since failed files might not have IDs
          const stateFile = state.files.find((f) => f.name === failedFile.file_name);
          if (stateFile) {
            stateFile.status = 'failed';
            stateFile.error = failedFile.error;
          }
        });
      }

      // Create final reasoning entry if messageId exists
      if (messageId) {
        try {
          const reasoningEntry = createDashboardsReasoningMessage(
            state.toolCallId || `modify-dashboards-${Date.now()}`,
            state.files,
            'completed'
          );

          await updateMessageFields(messageId, {
            reasoning: [reasoningEntry],
          });

          const duration = Date.now() - startTime;
          console.info('[modify-dashboards] Execution completed', {
            messageId,
            duration,
            successCount: result.files.length,
            failedCount: result.failed_files.length,
          });
        } catch (error) {
          console.error('[modify-dashboards] Failed to update final reasoning', {
            messageId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return result as ModifyDashboardsOutput;
    },
    { name: 'modify-dashboards-execute' }
  );
}
