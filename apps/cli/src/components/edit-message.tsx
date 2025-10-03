import { Box, Text, useInput } from 'ink';
import React, { useState } from 'react';
import path from 'node:path';
import type { AgentMessage } from '../services/analytics-engineer-handler';

interface EditMessageProps {
  message: Extract<AgentMessage, { kind: 'edit' }>;
}

interface ParsedDiffLine {
  lineNumber?: number;
  type: 'add' | 'remove' | 'context';
  content: string;
}

/**
 * Parse unified diff format into structured line data
 */
function parseDiff(diff: string): { lines: ParsedDiffLine[]; additions: number; removals: number } {
  const lines: ParsedDiffLine[] = [];
  let additions = 0;
  let removals = 0;
  let oldLineNumber = 0;
  let newLineNumber = 0;

  const diffLines = diff.split('\n');

  for (const line of diffLines) {
    // Skip header lines
    if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
      // Extract line numbers from @@ marker
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          oldLineNumber = parseInt(match[1] || '1', 10);
          newLineNumber = parseInt(match[2] || '1', 10);
        }
      }
      continue;
    }

    if (line.startsWith('+')) {
      lines.push({ lineNumber: newLineNumber++, type: 'add', content: line.slice(1) });
      additions++;
    } else if (line.startsWith('-')) {
      lines.push({ lineNumber: oldLineNumber++, type: 'remove', content: line.slice(1) });
      removals++;
    } else if (line.startsWith(' ')) {
      lines.push({ lineNumber: newLineNumber++, type: 'context', content: line.slice(1) });
      oldLineNumber++;
    }
  }

  return { lines, additions, removals };
}

/**
 * Component for displaying file edit operations with diff view
 * Shows UPDATE badge, file summary, and colored diff
 * Supports expansion with Ctrl+O to show full diff
 */
export function EditMessage({ message }: EditMessageProps) {
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
  const relativePath = path.relative(process.cwd(), result.filePath);

  // Get diff (either from single edit or multi-edit)
  const diffString = result.diff || result.finalDiff;

  if (!diffString) {
    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          <Text bold color="white" backgroundColor="cyan">
            UPDATE
          </Text>
          <Text color="#94a3b8"> ({relativePath})</Text>
        </Box>
        <Box paddingLeft={2}>
          <Text color={result.success ? '#64748b' : 'red'} dimColor>
            ↳ {result.success ? result.message || 'File updated' : result.errorMessage || 'Update failed'}
          </Text>
        </Box>
      </Box>
    );
  }

  // Parse the diff
  const { lines, additions, removals } = parseDiff(diffString);

  // Show first 10 lines when not expanded, all lines when expanded
  const displayLines = isExpanded ? lines : lines.slice(0, 10);

  return (
    <Box flexDirection="column">
      {/* UPDATE badge with file summary */}
      <Box flexDirection="row">
        <Text bold color="white" backgroundColor="cyan">
          UPDATE
        </Text>
        <Text color="#94a3b8">
          {' '}({relativePath})
        </Text>
      </Box>

      {/* Summary line */}
      <Box paddingLeft={2}>
        <Text color="#64748b" dimColor>
          ↳ Updated {relativePath} with {additions} addition{additions !== 1 ? 's' : ''} and {removals} removal{removals !== 1 ? 's' : ''}
        </Text>
      </Box>

      {/* Diff lines - always show with indentation */}
      {displayLines.length > 0 && (
        <Box flexDirection="column" paddingLeft={2}>
          {displayLines.map((line, idx) => {
            // Format line number if present
            const lineNum = line.lineNumber ? `${line.lineNumber}`.padStart(4, ' ') : '    ';

            // Choose background color and prefix based on line type
            let backgroundColor: string | undefined = undefined;
            let prefix = ' ';

            if (line.type === 'add') {
              backgroundColor = '#10b981'; // green background for additions
              prefix = '+';
            } else if (line.type === 'remove') {
              backgroundColor = '#ef4444'; // red background for removals
              prefix = '-';
            }

            return (
              <Text key={idx} color="#e0e7ff" backgroundColor={backgroundColor}>
                {lineNum} {prefix} {line.content}
              </Text>
            );
          })}
        </Box>
      )}

      {/* Expansion hint if diff is long */}
      {lines.length > 10 && (
        <Box paddingLeft={2}>
          <Text color="#64748b" dimColor>
            {isExpanded ? '(Press Ctrl+O to collapse)' : `... +${lines.length - 10} lines (Press Ctrl+O to expand)`}
          </Text>
        </Box>
      )}
    </Box>
  );
}
