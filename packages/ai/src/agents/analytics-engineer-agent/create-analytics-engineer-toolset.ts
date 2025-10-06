import {
  BASH_TOOL_NAME,
  EDIT_FILE_TOOL_NAME,
  GREP_TOOL_NAME,
  IDLE_TOOL_NAME,
  LS_TOOL_NAME,
  MULTI_EDIT_FILE_TOOL_NAME,
  READ_FILE_TOOL_NAME,
  TODO_WRITE_TOOL_NAME,
  WRITE_FILE_TOOL_NAME,
  createBashTool,
  createEditFileTool,
  createGrepTool,
  createIdleTool,
  createLsTool,
  createMultiEditFileTool,
  createReadFileTool,
  createTaskTool,
  createTodoWriteTool,
  createWriteFileTool,
} from '../../tools';
import type { AgentFactory } from '../../tools/task-tools/task-tool/task-tool';
import { createAnalyticsEngineerAgent } from './analytics-engineer-agent';
import type { AnalyticsEngineerAgentOptions } from './types';

export async function createAnalyticsEngineerToolset(
  analyticsEngineerAgentOptions: AnalyticsEngineerAgentOptions
) {
  const idleTool = createIdleTool({});
  const writeFileTool = createWriteFileTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
  });
  const grepTool = createGrepTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
  });
  const readFileTool = createReadFileTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
  });
  const bashTool = createBashTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
  });
  const editFileTool = createEditFileTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
  });
  const multiEditFileTool = createMultiEditFileTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
  });
  const lsTool = createLsTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
  });
  const todosTool = createTodoWriteTool({
    chatId: analyticsEngineerAgentOptions.chatId,
    workingDirectory: analyticsEngineerAgentOptions.folder_structure,
    todosList: analyticsEngineerAgentOptions.todosList,
  });
  // Conditionally create task tool (only for main agent, not for subagents)
  const taskTool = !analyticsEngineerAgentOptions.isSubagent
    ? createTaskTool({
        messageId: analyticsEngineerAgentOptions.messageId,
        projectDirectory: analyticsEngineerAgentOptions.folder_structure,
        // Pass the agent factory function to enable task agent creation
        // This needs to match the AgentFactory type signature
        createAgent: ((options: AnalyticsEngineerAgentOptions) => {
          return createAnalyticsEngineerAgent({
            ...options,
            // Inherit model from parent agent if provided
            model: analyticsEngineerAgentOptions.model,
          });
        }) as unknown as AgentFactory,
      })
    : null;

  return {
    [IDLE_TOOL_NAME]: idleTool,
    [WRITE_FILE_TOOL_NAME]: writeFileTool,
    [GREP_TOOL_NAME]: grepTool,
    [READ_FILE_TOOL_NAME]: readFileTool,
    [BASH_TOOL_NAME]: bashTool,
    [EDIT_FILE_TOOL_NAME]: editFileTool,
    [MULTI_EDIT_FILE_TOOL_NAME]: multiEditFileTool,
    [LS_TOOL_NAME]: lsTool,
    [TODO_WRITE_TOOL_NAME]: todosTool,
    ...(taskTool ? { taskTool } : {}),
  };
}
