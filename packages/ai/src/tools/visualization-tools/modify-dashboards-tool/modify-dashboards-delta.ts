import { updateMessageEntries } from '@buster/database';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import {
  TOOL_KEYS,
  createDashboardsReasoningMessage,
  createDashboardsResponseMessage,
  updateDashboardsProgressMessage,
} from './helpers/modify-dashboards-transform-helper';
import type {
  ModifyDashboardsContext,
  ModifyDashboardsInput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

// Factory function for onInputDelta callback
export function createModifyDashboardsDelta(
  context: ModifyDashboardsContext,
  state: ModifyDashboardsState
) {
  return wrapTraced(
    async (delta: string | Partial<ModifyDashboardsInput>) => {
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
          TOOL_KEYS.files,
          []
        );

        if (filesArray && Array.isArray(filesArray)) {
          // Update state files with streaming data
          filesArray.forEach((file, index) => {
            if (file && typeof file === 'object') {
              const hasId = TOOL_KEYS.id in file && file[TOOL_KEYS.id];
              const hasContent = TOOL_KEYS.yml_content in file && file[TOOL_KEYS.yml_content];

              // Update or add file when we have id and content
              if (hasId && hasContent) {
                const id = file[TOOL_KEYS.id] as string;
                const ymlContent = file[TOOL_KEYS.yml_content] as string;

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
                  id: file[TOOL_KEYS.id] as string,
                  yml_content: '',
                  status: 'processing',
                };
              }
            }
          });

          // Update database with progress if we have a messageId
          if (messageId && state.toolCallId) {
            try {
              // Create updated reasoning entry (filter out undefined entries)
              const validFiles = state.files.filter((f) => f);
              const reasoningEntry = createDashboardsReasoningMessage(
                state.toolCallId,
                validFiles,
                'loading'
              );

              // Get progress message
              const progressMessage = updateDashboardsProgressMessage(validFiles);
              const responseEntry = createDashboardsResponseMessage(
                state.toolCallId,
                progressMessage
              );

              // Create raw LLM message
              const rawLlmMessage: ModelMessage = {
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolCallId: state.toolCallId,
                    toolName: 'modify-dashboards',
                    input: state.parsedArgs || {},
                  },
                ],
              };

              console.info('[modify-dashboards] Updating database with streaming progress', {
                messageId,
                progressMessage,
                fileCount: validFiles.length,
                processedCount: validFiles.filter((f) => f.yml_content).length,
              });

              // Update entries with current progress
              await updateMessageEntries({
                messageId,
                reasoningEntry,
                responseEntry,
                rawLlmMessage,
                mode: 'update',
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
    },
    { name: 'modify-dashboards-delta' }
  );
}
