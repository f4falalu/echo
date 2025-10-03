import { Box, Text, useInput } from 'ink';
import React, { useState } from 'react';
import type { AgentMessage } from '../services/analytics-engineer-handler';

interface ExecuteMessageProps {
  message: Extract<AgentMessage, { kind: 'bash' | 'grep' | 'ls' }>;
}

/**
 * Component for displaying bash, grep, and ls command execution
 * Shows EXECUTE badge, command description, and output logs
 * Supports expansion with Ctrl+O to show full output
 */
export function ExecuteMessage({ message }: ExecuteMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle Ctrl+O to toggle expansion
  useInput((input, key) => {
    if (key.ctrl && input === 'o') {
      setIsExpanded((prev) => !prev);
    }
  });

  const { args, result } = message;

  // Get command description and output based on tool type
  let description = '';
  let output = '';
  let exitCode: number | undefined;
  let success = true;

  if (message.kind === 'bash') {
    description = args.description || args.command;
    if (result) {
      output = result.stdout || result.stderr || '';
      exitCode = result.exitCode;
      success = result.success;
    }
  } else if (message.kind === 'grep') {
    description = `Search for "${args.pattern}"${args.glob ? ` in ${args.glob}` : ''}`;
    if (result) {
      output = result.matches
        .map((m) => `${m.path}:${m.lineNum}: ${m.lineText}`)
        .join('\n');
      success = result.totalMatches > 0;
    }
  } else if (message.kind === 'ls') {
    description = `List directory ${args.path || '.'}`;
    if (result) {
      output = result.output;
      success = result.success;
    }
  }

  // Split output into lines for display
  const outputLines = output.split('\n').filter(Boolean);

  // Show last 5 lines when not expanded, all lines when expanded
  const displayLines = isExpanded ? outputLines : outputLines.slice(-5);

  return (
    <Box flexDirection="column">
      {/* EXECUTE badge with actual command in parentheses */}
      <Box flexDirection="row">
        <Text bold color="white" backgroundColor="orange">
          EXECUTE
        </Text>
        <Text color="#94a3b8"> ({args.command})</Text>
      </Box>

      {/* Output lines - always show with indentation */}
      {outputLines.length > 0 && (
        <Box flexDirection="column" paddingLeft={2}>
          {displayLines.map((line, idx) => (
            <Text key={idx} color="#e0e7ff">
              {line}
            </Text>
          ))}
        </Box>
      )}

      {/* Exit code/status line with indentation */}
      {message.kind === 'bash' && exitCode !== undefined && (
        <Box paddingLeft={2}>
          <Text color={success ? '#64748b' : 'red'} dimColor>
            ↳ Exit code: {exitCode}. Output: {outputLines.length} lines.
          </Text>
        </Box>
      )}

      {message.kind === 'grep' && result && (
        <Box paddingLeft={2}>
          <Text color={result.totalMatches > 0 ? 'green' : 'yellow'}>
            ↳ Found {result.totalMatches} match{result.totalMatches !== 1 ? 'es' : ''}
            {result.truncated ? ' (truncated)' : ''}
          </Text>
        </Box>
      )}

      {message.kind === 'ls' && result && (
        <Box paddingLeft={2}>
          <Text color={result.success ? 'green' : 'red'}>
            ↳ Listed {result.count} file{result.count !== 1 ? 's' : ''}
            {result.truncated ? ' (truncated)' : ''}
            {result.errorMessage ? `: ${result.errorMessage}` : ''}
          </Text>
        </Box>
      )}

      {/* Expansion hint if output is long */}
      {outputLines.length > 5 && (
        <Box paddingLeft={2}>
          <Text color="#64748b" dimColor>
            {isExpanded ? '(Press Ctrl+O to collapse)' : `... (${outputLines.length - 5} more lines, press Ctrl+O to expand)`}
          </Text>
        </Box>
      )}
    </Box>
  );
}
