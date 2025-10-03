import { Box } from 'ink';
import React from 'react';
import type { AgentMessage } from '../types/agent-messages';
import { UI_CONSTANTS } from '../constants/ui';
import { useExpansion } from '../hooks/use-expansion';
import { getPreviewLines } from '../utils/content-preview';
import { ToolBadge } from './shared/tool-badge';
import { IndentedContent } from './shared/indented-content';
import { ExpansionHint } from './shared/expansion-hint';
import { StatusLine } from './shared/status-line';
import { ContentLines } from './shared/content-lines';

interface ReadMessageProps {
  message: Extract<AgentMessage, { kind: 'read' }>;
}

/**
 * Component for displaying file read operations
 * Shows READ badge, relative file path, and file content preview
 * Supports expansion with Ctrl+O to show full content
 */
export function ReadMessage({ message }: ReadMessageProps) {
  const [isExpanded] = useExpansion();
  const { args, result } = message;

  if (!result) {
    return null;
  }

  // Handle error case
  if (result.status === 'error') {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <ToolBadge tool="READ" filePath={result.file_path} />
        <StatusLine message={`Error: ${result.error_message}`} status="error" />
      </Box>
    );
  }

  // Split content into lines
  const contentLines = result.content?.split('\n') || [];

  // Show first 5 lines when not expanded, all lines when expanded
  const displayLines = getPreviewLines(result.content || '', UI_CONSTANTS.LINE_LIMITS.DEFAULT_PREVIEW, isExpanded);

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* READ badge with relative file path */}
      <ToolBadge tool="READ" filePath={result.file_path} />

      {/* File content lines - always show with indentation */}
      {contentLines.length > 0 && (
        <IndentedContent>
          <ContentLines lines={displayLines} />
        </IndentedContent>
      )}

      {/* Expansion hint if content is long */}
      <ExpansionHint
        isExpanded={isExpanded}
        totalLines={contentLines.length}
        visibleLines={UI_CONSTANTS.LINE_LIMITS.DEFAULT_PREVIEW}
      />

      {/* Status line with indentation */}
      <StatusLine
        message={`Read ${contentLines.length} lines${result.truncated ? ' (truncated at 1000 lines)' : ''}`}
        status="success"
      />
    </Box>
  );
}
