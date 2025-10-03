import type { IdleInput, IdleOutput } from '../../tools/communication-tools/idle-tool/idle-tool';
import type { BashToolInput, BashToolOutput } from '../../tools/file-tools/bash-tool/bash-tool';
import type {
  EditFileToolInput,
  EditFileToolOutput,
} from '../../tools/file-tools/edit-file-tool/edit-file-tool';
import type { GrepToolInput, GrepToolOutput } from '../../tools/file-tools/grep-tool/grep-tool';
import type { LsToolInput, LsToolOutput } from '../../tools/file-tools/ls-tool/ls-tool';
import type {
  ReadFileToolInput,
  ReadFileToolOutput,
} from '../../tools/file-tools/read-file-tool/read-file-tool';
import type {
  WriteFileToolInput,
  WriteFileToolOutput,
} from '../../tools/file-tools/write-file-tool/write-file-tool';

/**
 * Discriminated union of all possible tool events in the analytics engineer agent
 * This provides full type safety from tools -> CLI display
 */
export type ToolEvent =
  // Idle tool events
  | { tool: 'idleTool'; event: 'start'; args: IdleInput }
  | { tool: 'idleTool'; event: 'complete'; result: IdleOutput; args: IdleInput }
  // Bash tool events
  | { tool: 'bashTool'; event: 'start'; args: BashToolInput }
  | { tool: 'bashTool'; event: 'complete'; result: BashToolOutput; args: BashToolInput }
  // Grep tool events
  | { tool: 'grepTool'; event: 'start'; args: GrepToolInput }
  | { tool: 'grepTool'; event: 'complete'; result: GrepToolOutput; args: GrepToolInput }
  // Read file tool events
  | { tool: 'readFileTool'; event: 'start'; args: ReadFileToolInput }
  | { tool: 'readFileTool'; event: 'complete'; result: ReadFileToolOutput; args: ReadFileToolInput }
  // Write file tool events
  | { tool: 'writeFileTool'; event: 'start'; args: WriteFileToolInput }
  | {
      tool: 'writeFileTool';
      event: 'complete';
      result: WriteFileToolOutput;
      args: WriteFileToolInput;
    }
  // Edit file tool events
  | { tool: 'editFileTool'; event: 'start'; args: EditFileToolInput }
  | { tool: 'editFileTool'; event: 'complete'; result: EditFileToolOutput; args: EditFileToolInput }
  // Ls tool events
  | { tool: 'lsTool'; event: 'start'; args: LsToolInput }
  | { tool: 'lsTool'; event: 'complete'; result: LsToolOutput; args: LsToolInput };

/**
 * Callback type for tool events - single typed callback for all tools
 */
export type ToolEventCallback = (event: ToolEvent) => void;
