import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type {
  CreateDashboardsContext,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';
import {
  createCreateDashboardsRawLlmMessageEntry,
  createCreateDashboardsReasoningEntry,
} from './helpers/create-dashboards-tool-transform-helper';

export function createCreateDashboardsFinish(
  context: CreateDashboardsContext,
  state: CreateDashboardsState
) {
  return async (options: { input: CreateDashboardsInput } & ToolCallOptions) => {
    const input = options.input;

    console.info('[create-dashboards] Input fully available:', {
      filesCount: input.files.length,
    });

    state.parsedArgs = input;

    state.files = input.files.map((f) => ({
      name: f.name,
      yml_content: f.yml_content,
      status: 'processing' as const,
    }));

    // Update database with both reasoning and raw LLM entries
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createCreateDashboardsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createCreateDashboardsRawLlmMessageEntry(state, options.toolCallId);

        // Update both entries together if they exist
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
        console.error('[create-dashboards] Error updating entries on finish:', error);
      }
    }
  };
}
