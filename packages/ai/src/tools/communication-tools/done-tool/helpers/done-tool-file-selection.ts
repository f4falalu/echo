import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import {
  CREATE_DASHBOARDS_TOOL_NAME,
  type CreateDashboardsOutput,
} from '../../../visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import {
  MODIFY_DASHBOARDS_TOOL_NAME,
  type ModifyDashboardsOutput,
} from '../../../visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import {
  CREATE_METRICS_TOOL_NAME,
  type CreateMetricsOutput,
} from '../../../visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import {
  MODIFY_METRICS_TOOL_NAME,
  type ModifyMetricsOutput,
} from '../../../visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import {
  CREATE_REPORTS_TOOL_NAME,
  type CreateReportsOutput,
} from '../../../visualization-tools/reports/create-reports-tool/create-reports-tool';
import {
  MODIFY_REPORTS_TOOL_NAME,
  type ModifyReportsOutput,
} from '../../../visualization-tools/reports/modify-reports-tool/modify-reports-tool';

// Union type for all tool outputs
type ToolOutput =
  | CreateMetricsOutput
  | ModifyMetricsOutput
  | CreateDashboardsOutput
  | ModifyDashboardsOutput
  | CreateReportsOutput
  | ModifyReportsOutput;

// File info from tool outputs
interface ToolFileInfo {
  id: string;
  name?: string;
  file_name?: string;
  file_type?: string;
  status?: string;
  version_number?: number;
  metric_ids?: string[];
  metricIds?: string[];
}

// File tracking type
interface ExtractedFile {
  id: string;
  fileType: 'metric' | 'dashboard' | 'report';
  fileName: string;
  status: 'completed' | 'failed' | 'loading';
  operation?: 'created' | 'modified' | undefined;
  versionNumber?: number | undefined;
  metricIds?: string[] | undefined; // IDs of metrics that belong to this dashboard
  content?: string | undefined; // Content of reports for checking absorbed files
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
            type: (content as unknown as Record<string, unknown>)?.type,
            hasToolName: 'toolName' in (content || {}),
            toolName: (content as unknown as Record<string, unknown>)?.toolName,
            hasOutput: 'output' in (content || {}),
            contentKeys: content ? Object.keys(content) : [],
          });

          if (content && typeof content === 'object') {
            // Check if this is a tool-result type
            if ('type' in content && content.type === 'tool-result') {
              // Extract the tool name and output
              const toolName = (content as unknown as Record<string, unknown>).toolName;
              const output = (content as unknown as Record<string, unknown>).output;

              console.info('[done-tool-file-selection] Found tool-result', {
                toolName,
                hasOutput: !!output,
                outputType: (output as Record<string, unknown>)?.type,
              });

              const outputObj = output as Record<string, unknown>;
              if (outputObj && outputObj.type === 'json' && outputObj.value) {
                try {
                  // Check if output.value is already an object or needs parsing
                  const parsedOutput =
                    typeof outputObj.value === 'string'
                      ? JSON.parse(outputObj.value)
                      : outputObj.value;
                  processToolOutput(toolName as string, parsedOutput, files);
                } catch (error) {
                  console.warn('[done-tool-file-selection] Failed to parse JSON output', {
                    toolName,
                    error,
                    valueType: typeof outputObj.value,
                    value: outputObj.value,
                  });
                }
              }
            }
            // Also check if the content itself has files directly (backward compatibility)
            else if ('files' in content || 'file' in content) {
              console.info('[done-tool-file-selection] Found direct file content in tool result');
              processDirectFileContent(content, files);
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

  // Filter out metrics that belong to dashboards
  let filteredFiles = filterOutDashboardMetrics(deduplicatedFiles);

  // Filter out metrics and dashboards that are absorbed by reports
  filteredFiles = filterOutReportContainedFiles(filteredFiles);

  console.info('[done-tool-file-selection] Final selected files', {
    totalSelected: filteredFiles.length,
    selectedIds: filteredFiles.map((f) => ({ id: f.id, type: f.fileType, name: f.fileName })),
  });

  return filteredFiles;
}

/**
 * Process tool output based on tool name
 */
function processToolOutput(toolName: string, output: unknown, files: ExtractedFile[]): void {
  const toolOutput = output as ToolOutput;
  console.info('[done-tool-file-selection] Processing tool output', {
    toolName,
    hasFiles: toolOutput && 'files' in toolOutput,
    hasFile: toolOutput && 'file' in toolOutput,
    outputKeys: toolOutput ? Object.keys(toolOutput) : [],
  });

  // Handle different tool types based on their name constants
  switch (toolName) {
    case CREATE_METRICS_TOOL_NAME:
    case MODIFY_METRICS_TOOL_NAME:
      processMetricsOutput(
        output,
        files,
        toolName === MODIFY_METRICS_TOOL_NAME ? 'modified' : 'created'
      );
      break;

    case CREATE_DASHBOARDS_TOOL_NAME:
    case MODIFY_DASHBOARDS_TOOL_NAME:
      processDashboardsOutput(
        output,
        files,
        toolName === MODIFY_DASHBOARDS_TOOL_NAME ? 'modified' : 'created'
      );
      break;

    case CREATE_REPORTS_TOOL_NAME:
    case MODIFY_REPORTS_TOOL_NAME:
      processReportsOutput(
        output,
        files,
        toolName === MODIFY_REPORTS_TOOL_NAME ? 'modified' : 'created'
      );
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
function processMetricsOutput(
  output: unknown,
  files: ExtractedFile[],
  operation: 'created' | 'modified'
): void {
  const metricsOutput = output as CreateMetricsOutput | ModifyMetricsOutput;
  if (metricsOutput.files && Array.isArray(metricsOutput.files)) {
    console.info('[done-tool-file-selection] Processing metrics files', {
      count: metricsOutput.files.length,
      operation,
    });

    for (const file of metricsOutput.files) {
      // Handle both possible structures - files have 'name' property
      const fileName = file.name;

      console.info('[done-tool-file-selection] Processing metric file', {
        id: file.id,
        fileName,
        fileType: 'metric',
        hasFileName: !!fileName,
        fileKeys: Object.keys(file),
      });

      if (file.id && fileName) {
        files.push({
          id: file.id,
          fileType: 'metric',
          fileName: fileName,
          status: 'completed',
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
function processDashboardsOutput(
  output: unknown,
  files: ExtractedFile[],
  operation: 'created' | 'modified'
): void {
  const dashboardOutput = output as CreateDashboardsOutput | ModifyDashboardsOutput;
  if (dashboardOutput.files && Array.isArray(dashboardOutput.files)) {
    console.info('[done-tool-file-selection] Processing dashboard files', {
      count: dashboardOutput.files.length,
      operation,
    });

    for (const file of dashboardOutput.files) {
      const fileName = file.name;

      // Extract metric IDs if they exist in the dashboard (added by our modification)
      const metricIds = (file as ToolFileInfo).metric_ids || [];

      if (file.id && fileName) {
        files.push({
          id: file.id,
          fileType: 'dashboard',
          fileName: fileName,
          status: 'completed',
          operation,
          versionNumber: file.version_number || 1,
          metricIds: Array.isArray(metricIds) && metricIds.length > 0 ? metricIds : undefined,
        });
      }
    }
  }
}

/**
 * Process reports output
 */
function processReportsOutput(
  output: unknown,
  files: ExtractedFile[],
  operation: 'created' | 'modified'
): void {
  const reportsOutput = output as CreateReportsOutput | ModifyReportsOutput;
  // Reports can have either files array or single file property
  if ('files' in reportsOutput && reportsOutput.files && Array.isArray(reportsOutput.files)) {
    console.info('[done-tool-file-selection] Processing report files array', {
      count: reportsOutput.files.length,
      operation,
    });

    for (const file of reportsOutput.files) {
      const fileName = file.name;

      if (file.id && fileName) {
        files.push({
          id: file.id,
          fileType: 'report',
          fileName: fileName,
          status: 'completed',
          operation,
          versionNumber: file.version_number || 1,
          // Note: content is not available in files array output
        });
      }
    }
  } else if (
    'file' in reportsOutput &&
    reportsOutput.file &&
    typeof reportsOutput.file === 'object'
  ) {
    // Handle single file for modify reports
    const file = reportsOutput.file;
    const fileName = file.name;

    console.info('[done-tool-file-selection] Processing single report file', {
      id: file.id,
      fileName,
      operation,
    });

    if (file.id && fileName) {
      files.push({
        id: file.id,
        fileType: 'report',
        fileName: fileName,
        status: 'completed',
        operation,
        versionNumber: file.version_number || 1,
        content: file.content, // Capture content from modify reports output
      });
    }
  }
}

/**
 * Process direct file content (backward compatibility)
 */
function processDirectFileContent(content: unknown, files: ExtractedFile[]): void {
  const contentObj = content as { files?: ToolFileInfo[] };
  if (contentObj.files && Array.isArray(contentObj.files)) {
    for (const file of contentObj.files) {
      const fileName = file.file_name || file.name || '';
      const fileType = file.file_type || 'metric';

      if (file.id && fileName) {
        files.push({
          id: file.id,
          fileType: fileType as 'metric' | 'dashboard' | 'report',
          fileName: fileName,
          status: 'completed',
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
 * Filter out metrics that belong to dashboards
 */
function filterOutDashboardMetrics(files: ExtractedFile[]): ExtractedFile[] {
  // Collect all metric IDs that belong to dashboards
  const metricsInDashboards = new Set<string>();

  for (const file of files) {
    if (file.fileType === 'dashboard' && file.metricIds) {
      for (const metricId of file.metricIds) {
        metricsInDashboards.add(metricId);
      }
    }
  }

  console.info('[done-tool-file-selection] Metrics belonging to dashboards', {
    metricCount: metricsInDashboards.size,
    metricIds: Array.from(metricsInDashboards),
  });

  // Filter out metrics that belong to dashboards
  const filtered = files.filter((file) => {
    // Keep all non-metric files
    if (file.fileType !== 'metric') {
      return true;
    }

    // Only keep metrics that don't belong to any dashboard
    const shouldExclude = metricsInDashboards.has(file.id);

    if (shouldExclude) {
      console.info('[done-tool-file-selection] Excluding metric that belongs to dashboard', {
        metricId: file.id,
        metricName: file.fileName,
      });
    }

    return !shouldExclude;
  });

  return filtered;
}

/**
 * Filter out metrics and dashboards that are absorbed by reports
 * Reports always get selected, but metrics/dashboards mentioned in report content are hidden
 */
function filterOutReportContainedFiles(files: ExtractedFile[]): ExtractedFile[] {
  // Collect all report contents
  const reportContents: string[] = [];
  for (const file of files) {
    if (file.fileType === 'report' && file.content) {
      reportContents.push(file.content);
    }
  }

  if (reportContents.length === 0) {
    // No report content to check against
    return files;
  }

  // Combine all report contents for searching
  const combinedReportContent = reportContents.join('\n');

  console.info('[done-tool-file-selection] Checking for files absorbed by reports', {
    reportCount: reportContents.length,
    hasContent: combinedReportContent.length > 0,
  });

  // Filter out metrics and dashboards that appear in report content
  const filtered = files.filter((file) => {
    // Always keep reports
    if (file.fileType === 'report') {
      return true;
    }

    // Check if this file's ID appears in any report content
    const isAbsorbed = combinedReportContent.includes(file.id);

    if (isAbsorbed) {
      console.info('[done-tool-file-selection] Excluding file absorbed by report', {
        fileId: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
      });
    }

    return !isAbsorbed;
  });

  return filtered;
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
