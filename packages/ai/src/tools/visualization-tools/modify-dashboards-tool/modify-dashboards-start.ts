import { updateMessageFields } from '@buster/database';
import {
  createDashboardsRawLlmMessageEntry,
  createDashboardsReasoningMessage,
} from './helpers/modify-dashboards-transform-helper';
import type {
  ModifyDashboardsAgentContext,
  ModifyDashboardsInput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

// Factory function for onInputStart callback
export function createModifyDashboardsStart<
  TAgentContext extends ModifyDashboardsAgentContext = ModifyDashboardsAgentContext,
>(context: TAgentContext, state: ModifyDashboardsState) {
  return async (input: ModifyDashboardsInput) => {
    // Log the start of dashboard modification
    const fileCount = input.files?.length || 0;
    const messageId = context.messageId;

    console.info('[modify-dashboards] Starting dashboard modification', {
      fileCount,
      messageId,
      timestamp: new Date().toISOString(),
    });

    // Initialize state
    state.processingStartTime = Date.now();
    state.toolCallId = `modify-dashboards-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize files in state (with IDs from input)
    state.files = input.files.map((file) => ({
      id: file.id,
      yml_content: file.yml_content,
      status: 'processing' as const,
    }));

    // If we have a messageId, create initial database entries
    if (messageId) {
      try {
        // Create initial reasoning entry
        const reasoningEntry = createDashboardsReasoningMessage(
          state.toolCallId,
          state.files,
          'loading'
        );
        state.reasoningEntryId = reasoningEntry.id;

        // Create raw LLM message entry
        const rawLlmEntry = createDashboardsRawLlmMessageEntry(
          state.toolCallId,
          'modify-dashboards-file',
          input
        );

        // Get existing messages to append to
        const existingMessages = await getExistingMessages(messageId);
        const existingReasoning = await getExistingReasoning(messageId);

        // Update database with initial entries
        await updateMessageFields(messageId, {
          rawLlmMessages: [...existingMessages, rawLlmEntry],
          reasoning: [...existingReasoning, reasoningEntry],
        });

        console.info('[modify-dashboards] Created initial database entries', {
          messageId,
          toolCallId: state.toolCallId,
          reasoningEntryId: state.reasoningEntryId,
        });
      } catch (error) {
        console.error('[modify-dashboards] Failed to create initial database entries', {
          messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}

// Helper to get existing messages (mock - should be replaced with actual DB query)
interface RawLlmMessage {
  type: string;
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

async function getExistingMessages(_messageId: string): Promise<RawLlmMessage[]> {
  // This would typically fetch from the database
  // For now, return empty array to append to
  return [];
}

// Helper to get existing reasoning (mock - should be replaced with actual DB query)
interface ReasoningMessage {
  id: string;
  type: string;
  title: string;
  status: string;
  file_ids: string[];
  files: Record<string, unknown>;
}

async function getExistingReasoning(_messageId: string): Promise<ReasoningMessage[]> {
  // This would typically fetch from the database
  // For now, return empty array to append to
  return [];
}
