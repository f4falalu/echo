import type { MessageEntry } from '@buster/database';
import type {
  ListFilesToolContext,
  ListFilesToolInput,
  ListFilesToolOutput,
} from '../list-files-tool';

export interface ListFilesToolDbEntry {
  entry_id: string;
  tool_name: string;
  args: ListFilesToolInput;
  result?: ListFilesToolOutput;
  status: 'loading' | 'success' | 'error';
  started_at?: Date;
  completed_at?: Date;
}

export function createListFilesToolTransformHelper(_context: ListFilesToolContext) {
  return (entry: ListFilesToolDbEntry): MessageEntry => {
    return {
      entry_id: entry.entry_id,
      type: 'tool_execution',
      tool_name: entry.tool_name,
      args: JSON.stringify(entry.args),
      result: entry.result ? JSON.stringify(entry.result) : null,
      status: entry.status,
      started_at: entry.started_at,
      completed_at: entry.completed_at,
    };
  };
}
