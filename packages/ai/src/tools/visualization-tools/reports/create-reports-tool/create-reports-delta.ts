import { randomUUID } from 'node:crypto';
import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../../utils/streaming/optimistic-json-parser';
import type {
  CreateReportStateFile,
  CreateReportsContext,
  CreateReportsInput,
  CreateReportsState,
} from './create-reports-tool';
import {
  createCreateReportsRawLlmMessageEntry,
  createCreateReportsReasoningEntry,
} from './helpers/create-reports-tool-transform-helper';

// Define TOOL_KEYS locally since we removed them from the helper
const TOOL_KEYS = {
  files: 'files' as const,
  name: 'name' as const,
  content: 'content' as const,
} satisfies {
  files: keyof CreateReportsInput;
  name: keyof CreateReportsInput['files'][number];
  content: keyof CreateReportsInput['files'][number];
};

export function createCreateReportsDelta(context: CreateReportsContext, state: CreateReportsState) {
  return async (options: { inputTextDelta: string } & ToolCallOptions) => {
    // Handle string deltas (accumulate JSON text)
    state.argsText = (state.argsText || '') + options.inputTextDelta;

    // Try to parse the accumulated JSON
    const parseResult = OptimisticJsonParser.parse(state.argsText || '');

    if (parseResult.parsed) {
      // Extract files array from parsed result
      const filesArray = getOptimisticValue<unknown[]>(
        parseResult.extractedValues,
        TOOL_KEYS.files,
        []
      );

      if (filesArray && Array.isArray(filesArray)) {
        // Update state files with streamed data
        const updatedFiles: CreateReportStateFile[] = [];

        filesArray.forEach((file, index) => {
          if (file && typeof file === 'object') {
            const fileObj = file as Record<string, unknown>;
            const name = getOptimisticValue<string>(
              new Map(Object.entries(fileObj)),
              TOOL_KEYS.name,
              ''
            );
            const content = getOptimisticValue<string>(
              new Map(Object.entries(fileObj)),
              TOOL_KEYS.content,
              ''
            );

            // Only add files that have at least a name
            if (name) {
              // Check if this file already exists in state to preserve its ID
              const existingFile = state.files?.[index];

              updatedFiles.push({
                id: existingFile?.id || randomUUID(),
                file_name: name,
                file_type: 'report',
                version_number: existingFile?.version_number || 1,
                file: content
                  ? {
                      text: content,
                    }
                  : undefined,
                status: 'loading',
              });
            }
          }
        });

        state.files = updatedFiles;
      }
    }

    // Update database with both reasoning and raw LLM entries
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createCreateReportsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createCreateReportsRawLlmMessageEntry(state, options.toolCallId);

        // Update both entries together if they exist
        const updates: Parameters<typeof updateMessageEntries>[0] = {
          messageId: context.messageId,
        };

        if (reasoningEntry) {
          updates.reasoningMessages = [reasoningEntry];
        }

        if (rawLlmMessage) {
          updates.rawLlmMessages = [rawLlmMessage];
        }

        if (reasoningEntry || rawLlmMessage) {
          await updateMessageEntries(updates);
        }
      } catch (error) {
        console.error('[create-reports] Error updating entries during delta:', error);
        // Don't throw - continue processing
      }
    }
  };
}
