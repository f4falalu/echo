import type {
  ChatMessageReasoningMessage,
} from '@buster/server-shared/chats';
import type { CoreMessage } from 'ai';
import type { ExecuteSqlOutput, ExecuteSqlState } from '../execute-sql';

/**
 * Create a reasoning entry for execute-sql tool
 */
export function createExecuteSqlReasoningEntry(
  state: ExecuteSqlState,
  toolCallId: string
): ChatMessageReasoningMessage | undefined {
  if (!state.statements || state.statements.length === 0) {
    return undefined;
  }

  // Format statements as YAML-like structure
  const statementsYaml = `statements:\n${state.statements.map((stmt) => `  - ${stmt}`).join('\n')}`;

  // If we have execution results, append them
  let fullContent = statementsYaml;
  if (state.executionResults && state.executionResults.length > 0) {
    let resultsYaml = '\n\nresults:';
    
    for (const result of state.executionResults) {
      resultsYaml += `\n  - status: ${result.status}`;
      resultsYaml += `\n    sql: ${result.sql}`;
      
      if (result.status === 'error' && result.error_message) {
        resultsYaml += `\n    error_message: |-\n      ${result.error_message}`;
      } else if (result.status === 'success' && result.results) {
        resultsYaml += '\n    results:';
        for (const row of result.results) {
          resultsYaml += '\n      -';
          for (const [key, value] of Object.entries(row)) {
            resultsYaml += `\n        ${key}: ${value}`;
          }
        }
      }
    }
    
    fullContent += resultsYaml;
  }

  // Calculate title based on results
  let title = 'Executing SQL';
  let status: 'loading' | 'completed' | 'failed' = 'loading';
  
  if (state.executionResults && state.isComplete) {
    const successCount = state.executionResults.filter((r) => r.status === 'success').length;
    const failedCount = state.executionResults.filter((r) => r.status === 'error').length;
    
    if (failedCount > 0) {
      title = `Ran ${successCount} validation ${successCount === 1 ? 'query' : 'queries'}, ${failedCount} failed`;
      status = 'failed';
    } else {
      title = `Ran ${state.executionResults.length} validation ${state.executionResults.length === 1 ? 'query' : 'queries'}`;
      status = 'completed';
    }
  } else if (state.statements.length > 0) {
    title = `Generated ${state.statements.length} validation ${state.statements.length === 1 ? 'query' : 'queries'}`;
  }

  // Calculate secondary title if we have execution time
  let secondaryTitle: string | undefined;
  if (state.executionTime !== undefined) {
    const seconds = state.executionTime / 1000;
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      secondaryTitle = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`;
    } else {
      secondaryTitle = `${seconds.toFixed(1)} seconds`;
    }
  }

  const fileId = `sql-${toolCallId}`;
  
  return {
    id: toolCallId,
    type: 'files',
    title,
    status,
    secondary_title: secondaryTitle,
    file_ids: [fileId],
    files: {
      [fileId]: {
        id: fileId,
        file_type: 'agent-action',
        file_name: 'SQL Statements',
        version_number: 1,
        status,
        file: {
          text: fullContent,
        },
      },
    },
  } as ChatMessageReasoningMessage;
}

/**
 * Create a raw LLM message entry for execute-sql tool
 */
export function createExecuteSqlRawLlmMessageEntry(
  state: ExecuteSqlState,
  toolCallId: string
): CoreMessage | undefined {
  if (!state.statements || state.statements.length === 0) {
    return undefined;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId,
        toolName: 'executeSql',
        args: {
          statements: state.statements,
        },
      },
    ],
  } as CoreMessage;
}