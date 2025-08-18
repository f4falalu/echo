import { randomUUID } from 'node:crypto';
import { assetPermissions, db, reportFiles, updateMessageEntries } from '@buster/database';
import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ToolCallOptions } from 'ai';
import type { CreateReportsContext, CreateReportsState } from './create-reports-tool';
import {
  createCreateReportsRawLlmMessageEntry,
  createCreateReportsReasoningEntry,
} from './helpers/create-reports-tool-transform-helper';

type VersionHistory = (typeof reportFiles.$inferSelect)['versionHistory'];

// Helper function to create initial version history
function createInitialReportVersionHistory(content: string, createdAt: string): VersionHistory {
  return {
    '1': {
      content,
      updated_at: createdAt,
      version_number: 1,
    },
  };
}

// Helper function to create file response messages for reports
function createReportFileResponseMessages(
  reports: Array<{ id: string; name: string }>
): ChatMessageResponseMessage[] {
  return reports.map((report) => ({
    id: report.id,
    type: 'file' as const,
    file_type: 'report' as const,
    file_name: report.name,
    version_number: 1,
    filter_version_id: null,
    metadata: [
      {
        status: 'loading' as const,
        message: 'Report is being generated...',
        timestamp: Date.now(),
      },
    ],
  }));
}

export function createReportsStart(context: CreateReportsContext, state: CreateReportsState) {
  return async (options: ToolCallOptions) => {
    // Reset state for new tool call to prevent contamination from previous calls
    state.toolCallId = options.toolCallId;
    state.argsText = undefined;
    state.files = [];
    state.startTime = Date.now();

    // Pre-generate report IDs and create placeholder reports immediately
    // We don't have the file names yet, so we'll generate temporary names
    const reportIds: string[] = [];
    const temporaryReports: Array<{ id: string; name: string }> = [];

    // We'll need to parse the initial arguments to get the file count
    // For now, let's prepare to handle multiple reports
    // We'll create these once we get the first delta with file names

    if (context.messageId) {
      try {
        // Create initial reasoning and raw LLM entries
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
        console.error('[create-reports] Error creating initial database entries:', error);
      }
    }
  };
}