import { OptimisticJsonParser, getOptimisticValue } from '@buster/ai/utils/streaming';
import { updateMessageReasoning } from '@buster/database';
import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import type {
  CreateDashboardsAgentContext,
  CreateDashboardsFile,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';
import {
  TOOL_KEYS,
  createDashboardsReasoningMessage,
} from './helpers/create-dashboards-tool-transform-helper';

export function createCreateDashboardsDelta<
  TAgentContext extends CreateDashboardsAgentContext = CreateDashboardsAgentContext,
>(context: TAgentContext, state: CreateDashboardsState) {
  return async (delta: Partial<CreateDashboardsInput> | string) => {
    // Handle string deltas (accumulate JSON text)
    if (typeof delta === 'string') {
      state.argsText += delta;

      // Try to parse the accumulated JSON
      const parseResult = OptimisticJsonParser.parse(state.argsText);

      if (parseResult.parsed) {
        // Extract files array from parsed result
        const filesArray = getOptimisticValue<unknown[]>(
          parseResult.extractedValues,
          TOOL_KEYS.files,
          []
        );

        if (filesArray && Array.isArray(filesArray)) {
          // Update state files with streamed data
          const updatedFiles: CreateDashboardsFile[] = [];

          filesArray.forEach((file) => {
            if (file && typeof file === 'object') {
              const fileObj = file as Record<string, unknown>;
              const name = getOptimisticValue<string>(
                new Map(Object.entries(fileObj)),
                TOOL_KEYS.name,
                ''
              );
              const ymlContent = getOptimisticValue<string>(
                new Map(Object.entries(fileObj)),
                TOOL_KEYS.yml_content,
                ''
              );

              if (name && ymlContent) {
                updatedFiles.push({
                  name,
                  yml_content: ymlContent,
                  status: 'processing',
                });
              }
            }
          });

          state.files = updatedFiles;
        }
      }
    } else {
      // Handle object deltas
      if (delta.files) {
        state.files = delta.files.map((f) => ({
          ...f,
          status: 'processing' as const,
        }));
      }
    }

    // Update database ONLY if both context.messageId AND state.reasoningEntryId exist
    if (context.messageId && state.reasoningEntryId) {
      try {
        // Filter out undefined entries
        const validFiles = state.files.filter((f) => f);

        if (validFiles.length > 0) {
          const reasoningMessage = createDashboardsReasoningMessage(
            state.toolCallId || `tool-${Date.now()}`,
            validFiles,
            'loading'
          );

          await updateMessageReasoning(
            context.messageId,
            state.reasoningEntryId,
            reasoningMessage as ChatMessageReasoningMessage
          );
        }
      } catch (error) {
        console.error('[create-dashboards] Error updating reasoning entry during delta:', error);
        // Don't throw - continue processing
      }
    }

    console.info('[create-dashboards] Delta processed', {
      fileCount: state.files.length,
      hasReasoningEntry: !!state.reasoningEntryId,
      messageId: context.messageId,
    });
  };
}
