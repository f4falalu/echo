import { Box, Text } from 'ink';
import React from 'react';

export type MessageType = 
  | 'PLAN'
  | 'EXECUTE'
  | 'WEB_SEARCH'
  | 'INFO'
  | 'ERROR'
  | 'SUCCESS'
  | 'WARNING'
  | 'DEBUG';

interface TypedMessageProps {
  type: MessageType;
  content: string;
  metadata?: string;
}

const typeStyles: Record<MessageType, { bg: string; fg: string; label: string }> = {
  PLAN: { bg: '#fb923c', fg: '#000000', label: 'PLAN' },
  EXECUTE: { bg: '#fb923c', fg: '#000000', label: 'EXECUTE' },
  WEB_SEARCH: { bg: '#fb923c', fg: '#000000', label: 'WEB SEARCH' },
  INFO: { bg: '#3b82f6', fg: '#ffffff', label: 'INFO' },
  ERROR: { bg: '#ef4444', fg: '#ffffff', label: 'ERROR' },
  SUCCESS: { bg: '#22c55e', fg: '#ffffff', label: 'SUCCESS' },
  WARNING: { bg: '#eab308', fg: '#000000', label: 'WARNING' },
  DEBUG: { bg: '#8b5cf6', fg: '#ffffff', label: 'DEBUG' },
};

export function TypedMessage({ type, content, metadata }: TypedMessageProps) {
  const style = typeStyles[type];
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={1}>
        <Text backgroundColor={style.bg} color={style.fg} bold>
          {` ${style.label} `}
        </Text>
        {metadata && (
          <Text dimColor>{metadata}</Text>
        )}
      </Box>
      <Box marginLeft={2} marginTop={0}>
        <Text>{content}</Text>
      </Box>
    </Box>
  );
}