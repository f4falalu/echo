import type { MessageEntry } from '@buster/database';
import type { CreateFilesToolContext } from '../create-files-tool';

export interface CreateFilesToolDbEntry {
  entry_id: string;
  tool_name: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  status: 'loading' | 'ready_to_execute' | 'completed' | 'error';
  started_at?: Date;
  completed_at?: Date;
}

export function createCreateFilesToolTransformHelper(_context: CreateFilesToolContext) {
  return (entry: CreateFilesToolDbEntry): MessageEntry => {
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
