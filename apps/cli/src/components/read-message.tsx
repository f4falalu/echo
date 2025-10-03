import { Box, Text, useInput } from 'ink';
import React, { useState } from 'react';
import path from 'node:path';
import type { AgentMessage } from '../services/analytics-engineer-handler';

interface ReadMessageProps {
  message: Extract<AgentMessage, { kind: 'read' }>;
}

/**
 * Component for displaying file read operations
 * Shows READ badge, relative file path, and file content preview
 * Supports expansion with Ctrl+O to show full content
 */
export function ReadMessage({ message }: ReadMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle Ctrl+O to toggle expansion
  useInput((input, key) => {
    if (key.ctrl && input === 'o') {
      setIsExpanded((prev) => !prev);
    }
  });

  const { args, result } = message;

  if (!result) {
    return null;
  }

  // Get relative path from cwd
  const relativePath = path.relative(process.cwd(), result.file_path);

  // Handle error case
  if (result.status === 'error') {
    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          <Text bold color="white" backgroundColor="blue">
            READ
          </Text>
          <Text color="#94a3b8"> ({relativePath})</Text>
        </Box>
        <Box paddingLeft={2}>
          <Text color="red" dimColor>
            ↳ Error: {result.error_message}
          </Text>
        </Box>
      </Box>
    );
  }

  // Split content into lines
  const contentLines = result.content?.split('\n') || [];

  // Show first 5 lines when not expanded, all lines when expanded
  const displayLines = isExpanded ? contentLines : contentLines.slice(0, 5);

  return (
    <Box flexDirection="column">
      {/* READ badge with relative file path */}
      <Box flexDirection="row">
        <Text bold color="white" backgroundColor="blue">
          READ
        </Text>
        <Text color="#94a3b8"> ({relativePath})</Text>
      </Box>

      {/* File content lines - always show with indentation */}
      {contentLines.length > 0 && (
        <Box flexDirection="column" paddingLeft={2}>
          {displayLines.map((line, idx) => (
            <Text key={idx} color="#e0e7ff">
              {line}
            </Text>
          ))}
        </Box>
      )}

      {/* Expansion hint if content is long */}
      {contentLines.length > 5 && (
        <Box paddingLeft={2}>
          <Text color="#64748b" dimColor>
            {isExpanded ? '(Press Ctrl+O to collapse)' : `... +${contentLines.length - 5} lines (Press Ctrl+O to expand)`}
          </Text>
        </Box>
      )}

      {/* Status line with indentation */}
      <Box paddingLeft={2}>
        <Text color="#64748b" dimColor>
          ↳ Read {contentLines.length} lines{result.truncated ? ' (truncated at 1000 lines)' : ''}
        </Text>
      </Box>
    </Box>
  );
}
