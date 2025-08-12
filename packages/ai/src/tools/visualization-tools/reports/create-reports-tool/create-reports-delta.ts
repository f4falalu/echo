import { randomUUID } from 'node:crypto';
import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../../utils/streaming/optimistic-json-parser';
import type { CreateReportsContext, CreateReportsState } from './create-reports-tool';
import {
  createCreateReportsRawLlmMessageEntry,
  createCreateReportsReasoningEntry,
} from './helpers/create-reports-tool-transform-helper';

// Define TOOL_KEYS locally
const TOOL_KEYS = {
  files: 'files' as const,
  name: 'name' as const,
  content: 'content' as const,
};

export function createCreateReportsDelta(context: CreateReportsContext, state: CreateReportsState) {
  return async (options: { inputTextDelta: string } & ToolCallOptions) => {
    // Handle string deltas (accumulate JSON text)
    state.argsText = (state.argsText || '') + options.inputTextDelta;

    // Parse the accumulated JSON to extract file information
    const parser = new OptimisticJsonParser();
    const optimisticArgs = parser.parse(state.argsText || '') as Record<string, any>;

    // Track parsed args for processing
    if (optimisticArgs) {
      const files = getOptimisticValue(optimisticArgs, TOOL_KEYS.files) as any[] | undefined;

      // Initialize state files if needed
      if (!state.files) {
        state.files = [];
      }

      // Process each file in the delta
      if (files && Array.isArray(files)) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (typeof file === 'object' && file) {
            const name = getOptimisticValue(file, TOOL_KEYS.name) as string | undefined;
            const content = getOptimisticValue(file, TOOL_KEYS.content) as string | undefined;

            // Check if this file index already exists in state
            if (!state.files[i] && name) {
              // New file - add to state with UUID
              const reportId = randomUUID();
              state.files[i] = {
                id: reportId,
                file_name: name,
                file_type: 'report',
                version_number: 1,
                status: 'loading',
                file: content ? { text: content } : undefined,
              };
            } else if (state.files[i]) {
              // Update existing file
              if (name) state.files[i].file_name = name;
              if (content) state.files[i].file = { text: content };
            }
          }
        }
      }
    }

    // Update database entries with current state
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createCreateReportsReasoningEntry(state, state.toolCallId);
        const rawLlmMessage = createCreateReportsRawLlmMessageEntry(state, state.toolCallId);

        const updates: Parameters<typeof updateMessageEntries>[0] = {
          messageId: context.messageId,
          mode: 'update',
        };

        if (reasoningEntry) {
          updates.responseEntry = reasoningEntry;
        }

        if (rawLlmMessage) {
          updates.rawLlmMessage = rawLlmMessage;
        }

        if (reasoningEntry || rawLlmMessage) {
          await updateMessageEntries(updates);
        }
      } catch (error) {
        console.error('[create-reports] Error updating entries on delta:', error);
      }
    }
  };
}
