import { Box, Text } from 'ink';
import React from 'react';
import type { AgentMessage } from '../services/analytics-engineer-handler';
import { ExecuteMessage } from './execute-message';
import { WriteMessage } from './write-message';

interface AgentMessageComponentProps {
  message: AgentMessage;
}

export function AgentMessageComponent({ message }: AgentMessageComponentProps) {
  switch (message.kind) {
    case 'user':
      return (
        <Box marginBottom={1}>
          <Text color="#a855f7" bold>
            ❯{' '}
          </Text>
          <Text color="#e0e7ff">{message.content}</Text>
        </Box>
      );

    case 'text-delta':
      return (
        <Box marginBottom={1}>
          <Text color="#e0e7ff">{message.content}</Text>
        </Box>
      );

    case 'idle':
      // For idle tool, just show the final response as plain text
      return (
        <Box marginBottom={1}>
          <Text color="#e0e7ff">
            {message.args?.final_response || 'Task completed'}
          </Text>
        </Box>
      );

    case 'bash':
    case 'grep':
    case 'ls':
      // For execute commands, use the ExecuteMessage component
      return <ExecuteMessage message={message} />;

    case 'write':
      // For write operations, use the WriteMessage component
      return <WriteMessage message={message} />;

    default:
      return null;
  }
}
