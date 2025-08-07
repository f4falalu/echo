import { updateMessageFields } from '@buster/database';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import {
  MODIFY_DASHBOARDS_KEYS,
  createDashboardsReasoningMessage,
  updateDashboardsProgressMessage,
} from './helpers/modify-dashboards-transform-helper';
import type {
  ModifyDashboardsAgentContext,
  ModifyDashboardsInput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

// Factory function for onInputDelta callback
export function createModifyDashboardsDelta<
  TAgentContext extends ModifyDashboardsAgentContext = ModifyDashboardsAgentContext,
>(context: TAgentContext, state: ModifyDashboardsState) {
  return async (delta: string | Partial<ModifyDashboardsInput>) => {
    const messageId = context.messageId;

    // Handle string deltas (streaming JSON)
    if (typeof delta === 'string') {
      state.argsText += delta;

      // Use optimistic parsing to extract values even from incomplete JSON
      const parseResult = OptimisticJsonParser.parse(state.argsText);

      // Update parsed args
      if (parseResult.parsed) {
        state.parsedArgs = parseResult.parsed as Partial<ModifyDashboardsInput>;
      }

      // Extract files array from optimistic parsing
      const filesArray = getOptimisticValue<unknown[]>(
        parseResult.extractedValues,
        MODIFY_DASHBOARDS_KEYS.files,
        []
      );

      if (filesArray && Array.isArray(filesArray)) {
        // Update state files with streaming data
        filesArray.forEach((file, index) => {
          if (file && typeof file === 'object') {
            const hasId = MODIFY_DASHBOARDS_KEYS.id in file && file[MODIFY_DASHBOARDS_KEYS.id];
            const hasContent =
              MODIFY_DASHBOARDS_KEYS.yml_content in file &&
              file[MODIFY_DASHBOARDS_KEYS.yml_content];

            // Update or add file when we have id and content
            if (hasId && hasContent) {
              const id = file[MODIFY_DASHBOARDS_KEYS.id] as string;
              const ymlContent = file[MODIFY_DASHBOARDS_KEYS.yml_content] as string;

              // Check if file already exists in state
              if (state.files[index]) {
                // Update existing file
                state.files[index].id = id;
                state.files[index].yml_content = ymlContent;
              } else {
                // Add new file
                state.files[index] = {
                  id,
                  yml_content: ymlContent,
                  status: 'processing',
                };
              }
            } else if (hasId && !state.files[index]) {
              // Add placeholder with just id
              state.files[index] = {
                id: file[MODIFY_DASHBOARDS_KEYS.id] as string,
                yml_content: '',
                status: 'processing',
              };
            }
          }
        });

        // Update database with progress if we have a messageId and reasoningEntryId
        if (messageId && state.reasoningEntryId) {
          try {
            // Create updated reasoning entry (filter out undefined entries)
            const validFiles = state.files.filter((f) => f);
            const reasoningEntry = createDashboardsReasoningMessage(
              state.toolCallId || `modify-dashboards-${Date.now()}`,
              validFiles,
              'loading'
            );

            // Get progress message
            const progressMessage = updateDashboardsProgressMessage(validFiles);

            console.info('[modify-dashboards] Updating database with streaming progress', {
              messageId,
              progressMessage,
              fileCount: validFiles.length,
              processedCount: validFiles.filter((f) => f.yml_content).length,
            });

            // Update database with append mode for streaming
            await updateMessageFields(messageId, {
              reasoning: [reasoningEntry], // This will update the existing entry with the same ID
            });
          } catch (error) {
            console.error('[modify-dashboards] Failed to update streaming progress', {
              messageId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Don't throw - continue processing stream
          }
        }
      }
    } else {
      // Handle object deltas (complete input)
      if (delta.files) {
        state.parsedArgs = delta;
        state.files = delta.files.map((file) => ({
          id: file.id,
          yml_content: file.yml_content,
          status: 'processing' as const,
        }));
      }
    }

    console.info('[modify-dashboards] Input delta processed', {
      hasFiles: !!state.files.filter((f) => f).length,
      fileCount: state.files.filter((f) => f).length,
      processedCount: state.files.filter((f) => f?.yml_content).length,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
