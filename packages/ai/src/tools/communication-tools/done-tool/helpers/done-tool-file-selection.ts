import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import { CREATE_DASHBOARDS_TOOL_NAME } from '../../../visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import { MODIFY_DASHBOARDS_TOOL_NAME } from '../../../visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import { CREATE_METRICS_TOOL_NAME } from '../../../visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import { MODIFY_METRICS_TOOL_NAME } from '../../../visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import { CREATE_REPORTS_TOOL_NAME } from '../../../visualization-tools/reports/create-reports-tool/create-reports-tool';
import { MODIFY_REPORTS_TOOL_NAME } from '../../../visualization-tools/reports/modify-reports-tool/modify-reports-tool';

// File tracking type
interface ExtractedFile {
  id: string;
  fileType: 'metric' | 'dashboard' | 'report';
  fileName: string;
  status: 'completed' | 'failed' | 'loading';
  operation?: 'created' | 'modified' | undefined;
  versionNumber?: number | undefined;
}

/**
 * Extract files from tool call responses in the conversation messages
 * Focuses on tool result messages that contain file information
 */
export function extractFilesFromToolCalls(messages: ModelMessage[]): ExtractedFile[] {
  const files: ExtractedFile[] = [];

  console.info('[done-tool-file-selection] Starting file extraction from messages', {
    messageCount: messages.length,
  });

  // Process each message looking for tool results
  for (const message of messages) {
    console.info('[done-tool-file-selection] Processing message', {
      role: message.role,
      contentType: Array.isArray(message.content) ? 'array' : typeof message.content,
    });
    
    if (message.role === 'tool') {
      // Tool messages contain the actual results
      const toolContent = message.content;

      if (Array.isArray(toolContent)) {
        // Handle array of tool results
        for (const content of toolContent) {
          console.info('[done-tool-file-selection] Processing tool content item', {
            hasType: 'type' in (content || {}),
            type: (content as any)?.type,
            hasToolName: 'toolName' in (content || {}),
            toolName: (content as any)?.toolName,
            hasOutput: 'output' in (content || {}),
            contentKeys: content ? Object.keys(content) : [],
          });
          
          if (content && typeof content === 'object') {
            // Check if this is a tool-result type
            if ('type' in content && content.type === 'tool-result') {
              // Extract the tool name and output
              const toolName = (content as any).toolName;
              const output = (content as any).output;
              
              console.info('[done-tool-file-selection] Found tool-result', {
                toolName,
                hasOutput: !!output,
                outputType: output?.type,
              });
              
              if (output && output.type === 'json' && output.value) {
                try {
                  // Check if output.value is already an object or needs parsing
                  const parsedOutput = typeof output.value === 'string' 
                    ? JSON.parse(output.value)
                    : output.value;
                  processToolOutput(toolName, parsedOutput, files);
                } catch (error) {
                  console.warn('[done-tool-file-selection] Failed to parse JSON output', {
                    toolName,
                    error,
                    valueType: typeof output.value,
                    value: output.value,
                  });
                }
              }
            }
            // Also check if the content itself has files directly (backward compatibility)
            else if ('files' in content || 'file' in content) {
              console.info('[done-tool-file-selection] Found direct file content in tool result');
              processDirectFileContent(content as any, files);
            }
          }
        }
      }
    }
  }

  console.info('[done-tool-file-selection] Extracted files before deduplication', {
    totalFiles: files.length,
    metrics: files.filter((f) => f.fileType === 'metric').length,
    dashboards: files.filter((f) => f.fileType === 'dashboard').length,
    reports: files.filter((f) => f.fileType === 'report').length,
  });

  // Deduplicate files by ID, keeping highest version
  const deduplicatedFiles = deduplicateFilesByVersion(files);

  console.info('[done-tool-file-selection] Final selected files', {
    totalSelected: deduplicatedFiles.length,
    selectedIds: deduplicatedFiles.map((f) => ({ id: f.id, type: f.fileType, name: f.fileName })),
  });

  return deduplicatedFiles;
}

/**
 * Process tool output based on tool name
 */
function processToolOutput(toolName: string, output: any, files: ExtractedFile[]): void {
  console.info('[done-tool-file-selection] Processing tool output', {
    toolName,
    hasFiles: 'files' in (output || {}),
    hasFile: 'file' in (output || {}),
    outputKeys: output ? Object.keys(output) : [],
  });

  // Handle different tool types based on their name constants
  switch (toolName) {
    case CREATE_METRICS_TOOL_NAME:
    case MODIFY_METRICS_TOOL_NAME:
      processMetricsOutput(output, files, toolName === MODIFY_METRICS_TOOL_NAME ? 'modified' : 'created');
      break;

    case CREATE_DASHBOARDS_TOOL_NAME:
    case MODIFY_DASHBOARDS_TOOL_NAME:
      processDashboardsOutput(output, files, toolName === MODIFY_DASHBOARDS_TOOL_NAME ? 'modified' : 'created');
      break;

    case CREATE_REPORTS_TOOL_NAME:
    case MODIFY_REPORTS_TOOL_NAME:
      processReportsOutput(output, files, toolName === MODIFY_REPORTS_TOOL_NAME ? 'modified' : 'created');
      break;

    default:
      console.info('[done-tool-file-selection] Unknown tool name, skipping', {
        toolName,
      });
  }
}

/**
 * Process metrics output
 */
function processMetricsOutput(output: any, files: ExtractedFile[], operation: 'created' | 'modified'): void {
  if (output.files && Array.isArray(output.files)) {
    console.info('[done-tool-file-selection] Processing metrics files', {
      count: output.files.length,
      operation,
    });
    
    for (const file of output.files) {
      // Handle both possible structures
      const fileName = file.file_name || file.name;
      const fileType = file.file_type || 'metric';
      
      console.info('[done-tool-file-selection] Processing metric file', {
        id: file.id,
        fileName,
        fileType,
        hasFileName: !!fileName,
        fileKeys: Object.keys(file),
      });
      
      if (file.id && fileName) {
        files.push({
          id: file.id,
          fileType: fileType as 'metric' | 'dashboard' | 'report',
          fileName: fileName,
          status: file.status || 'completed',
          operation,
          versionNumber: file.version_number || 1,
        });
      }
    }
  }
}

/**
 * Process dashboards output
 */
function processDashboardsOutput(output: any, files: ExtractedFile[], operation: 'created' | 'modified'): void {
  if (output.files && Array.isArray(output.files)) {
    console.info('[done-tool-file-selection] Processing dashboard files', {
      count: output.files.length,
      operation,
    });
    
    for (const file of output.files) {
      // Handle both possible structures
      const fileName = file.file_name || file.name;
      const fileType = file.file_type || 'dashboard';
      
      if (file.id && fileName) {
        files.push({
          id: file.id,
          fileType: fileType as 'metric' | 'dashboard' | 'report',
          fileName: fileName,
          status: file.status || 'completed',
          operation,
          versionNumber: file.version_number || 1,
        });
      }
    }
  }
}

/**
 * Process reports output
 */
function processReportsOutput(output: any, files: ExtractedFile[], operation: 'created' | 'modified'): void {
  // Reports can have either files array or single file property
  if (output.files && Array.isArray(output.files)) {
    console.info('[done-tool-file-selection] Processing report files array', {
      count: output.files.length,
      operation,
    });
    
    for (const file of output.files) {
      // Handle both possible structures
      const fileName = file.file_name || file.name;
      const fileType = file.file_type || 'report';
      
      if (file.id && fileName) {
        files.push({
          id: file.id,
          fileType: fileType as 'metric' | 'dashboard' | 'report',
          fileName: fileName,
          status: file.status || 'completed',
          operation,
          versionNumber: file.version_number || 1,
        });
      }
    }
  } else if (output.file && typeof output.file === 'object') {
    // Handle single file for modify reports
    const file = output.file;
    const fileName = file.file_name || file.name;
    const fileType = file.file_type || 'report';
    
    console.info('[done-tool-file-selection] Processing single report file', {
      id: file.id,
      fileName,
      operation,
    });
    
    if (file.id && fileName) {
      files.push({
        id: file.id,
        fileType: fileType as 'metric' | 'dashboard' | 'report',
        fileName: fileName,
        status: file.status || 'completed',
        operation,
        versionNumber: file.version_number || 1,
      });
    }
  }
}

/**
 * Process direct file content (backward compatibility)
 */
function processDirectFileContent(content: any, files: ExtractedFile[]): void {
  if (content.files && Array.isArray(content.files)) {
    for (const file of content.files) {
      const fileName = file.file_name || file.name;
      const fileType = file.file_type || 'metric';
      
      if (file.id && fileName) {
        files.push({
          id: file.id,
          fileType: fileType as 'metric' | 'dashboard' | 'report',
          fileName: fileName,
          status: file.status || 'completed',
          operation: 'created',
          versionNumber: file.version_number || 1,
        });
      }
    }
  }
}

/**
 * Deduplicate files by ID, keeping the highest version number
 */
function deduplicateFilesByVersion(files: ExtractedFile[]): ExtractedFile[] {
  const deduplicated = new Map<string, ExtractedFile>();

  for (const file of files) {
    const existingFile = deduplicated.get(file.id);
    const fileVersion = file.versionNumber || 1;
    const existingVersion = existingFile?.versionNumber || 1;

    if (!existingFile || fileVersion > existingVersion) {
      deduplicated.set(file.id, file);
    }
  }

  return Array.from(deduplicated.values());
}

/**
 * Create file response messages for selected files
 */
export function createFileResponseMessages(files: ExtractedFile[]): ChatMessageResponseMessage[] {
  return files.map((file) => {
    // Determine the display name for the file type
    const fileTypeDisplay =
      file.fileType === 'dashboard'
        ? 'Dashboard'
        : file.fileType === 'metric'
          ? 'Metric'
          : file.fileType === 'report'
            ? 'Report'
            : file.fileType;

    return {
      id: file.id,
      type: 'file' as const,
      file_type: file.fileType as 'metric' | 'dashboard' | 'report',
      file_name: file.fileName,
      version_number: file.versionNumber || 1,
      filter_version_id: null,
      metadata: [
        {
          status: 'completed' as const,
          message: `${fileTypeDisplay} ${file.operation || 'created'} successfully`,
          timestamp: Date.now(),
        },
      ],
    };
  });
}