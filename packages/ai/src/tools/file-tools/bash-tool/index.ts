// Main factory function for bash tool
export { createBashTool } from './bash-tool';

// Types
export type {
  BashToolInput,
  BashToolOutput,
  BashToolContext,
  BashToolState,
} from './bash-tool';

// Legacy exports for backward compatibility
export { bashExecute, executeBash, createBashTool as createBashExecute } from './bash-execute-tool';
