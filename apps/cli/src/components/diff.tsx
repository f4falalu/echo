import { Box, Text } from 'ink';
import React from 'react';

interface DiffLine {
  lineNumber: number;
  content: string;
  type: 'add' | 'remove' | 'context';
}

interface DiffProps {
  lines: DiffLine[];
  fileName?: string;
}

export function Diff({ lines, fileName }: DiffProps) {
  return (
    <Box flexDirection="column" marginY={1}>
      {fileName && (
        <Box marginBottom={1}>
          <Text color="#64748b">{fileName}</Text>
        </Box>
      )}
      <Box flexDirection="column">
        {lines.map((line, index) => (
          <Box key={`${line.lineNumber}-${index}`} gap={1}>
            <Text color="#475569" dimColor>
              {String(line.lineNumber).padStart(3, ' ')}
            </Text>
            {line.type === 'add' && <Text color="#22c55e">+</Text>}
            {line.type === 'remove' && <Text color="#ef4444">-</Text>}
            {line.type === 'context' && <Text> </Text>}
            <Text
              backgroundColor={
                line.type === 'add' ? '#166534' : line.type === 'remove' ? '#7f1d1d' : undefined
              }
              color={line.type === 'add' || line.type === 'remove' ? '#ffffff' : '#e2e8f0'}
            >
              {line.content}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
