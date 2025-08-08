import type { MessageEntry, RawLlmMessage } from '@buster/database';
import type { BashToolState } from '../bash-tool';

export function createBashToolReasoningEntry(
  state: BashToolState,
  toolCallId: string
): MessageEntry | null {
  let status: MessageEntry['status'] = 'loading';
  let content = 'Preparing to execute bash commands...';

  if (state.executionResults) {
    const allSuccessful = state.executionResults.every((result) => result.success);
    status = allSuccessful ? 'success' : 'error';

    if (allSuccessful) {
      content = `Successfully executed ${state.executionResults.length} bash command(s)`;
    } else {
      const errorCount = state.executionResults.filter((result) => !result.success).length;
      content = `Failed to execute ${errorCount} out of ${state.executionResults.length} bash command(s)`;
    }
  } else if (state.commands && state.commands.length > 0) {
    content = `Executing ${state.commands.length} bash command(s)...`;
  } else if (state.isComplete) {
    content = 'No bash commands to execute';
    status = 'success';
  }

  return {
    id: `bash-tool-${toolCallId}`,
    type: 'reasoning',
    content,
    status,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export function createBashToolRawLlmMessageEntry(
  state: BashToolState,
  toolCallId: string
): RawLlmMessage | null {
  return {
    id: `bash-tool-raw-${toolCallId}`,
    tool_call_id: toolCallId,
    tool_name: 'bash-tool',
    args: state.args || '',
    result: state.executionResults ? JSON.stringify(state.executionResults, null, 2) : null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}
