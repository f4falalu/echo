import { Box, Text, useInput } from 'ink';
import React, { useState } from 'react';
import path from 'node:path';
import type { AgentMessage } from '../services/analytics-engineer-handler';

interface WriteMessageProps {
  message: Extract<AgentMessage, { kind: 'write' }>;
}

/**
 * Component for displaying write file operations
 * Shows WRITE badge, relative file path, and file content preview
 * Supports expansion with Ctrl+O to show full content
 */
export function WriteMessage({ message }: WriteMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle Ctrl+O to toggle expansion
  useInput((input, key) => {
    if (key.ctrl && input === 'o') {
      setIsExpanded((prev) => !prev);
    }
  });

  const { args, result } = message;

  // For each file, show its content
  return (
    <Box flexDirection="column">
      {args.files.map((file, fileIdx) => {
        // Get relative path from cwd
        const relativePath = path.relative(process.cwd(), file.path);

        // Split content into lines
        const contentLines = file.content.split('\n');

        // Show first 5 lines when not expanded, all lines when expanded
        const displayLines = isExpanded ? contentLines : contentLines.slice(0, 5);

        // Find the result for this file
        const fileResult = result?.results[fileIdx];
        const success = fileResult?.status === 'success';

        return (
          <Box key={fileIdx} flexDirection="column" marginBottom={fileIdx < args.files.length - 1 ? 1 : 0}>
            {/* WRITE badge with relative file path */}
            <Box flexDirection="row">
              <Text bold color="white" backgroundColor="magenta">
                WRITE
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
            {fileResult && (
              <Box paddingLeft={2}>
                <Text color={success ? '#64748b' : 'red'} dimColor>
                  ↳ {success ? `Wrote ${contentLines.length} lines` : `Failed: ${fileResult.errorMessage}`}
                </Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
