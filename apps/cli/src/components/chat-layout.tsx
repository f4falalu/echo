import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useMemo } from 'react';
import { SimpleBigText } from './simple-big-text';

export function ChatTitle() {
  return (
    <Box justifyContent="center">
      <SimpleBigText text="Buster" color="#f5f3ff" />
    </Box>
  );
}

export function ChatVersionTagline() {
  return (
    <Box justifyContent="center" marginTop={1}>
      <Text>
        <Text color="#a78bfa">BUSTER v0.3.1</Text>
        <Text color="#c4b5fd"> — Your AI Data Worker.</Text>
      </Text>
    </Box>
  );
}

export function ChatIntroText() {
  const lines = useMemo(
    () => [
      'You are standing in an open terminal. An AI awaits your commands.',
      'ENTER to send • \\ + ENTER for a new line • @ to mention files',
    ],
    []
  );

  return (
    <Box flexDirection="column" alignItems="center" marginTop={1}>
      {lines.map((line) => (
        <Text key={line} color="#e0e7ff">
          {line}
        </Text>
      ))}
    </Box>
  );
}

export function ChatStatusBar() {
  return (
    <Box
      borderStyle="single"
      borderColor="#4338ca"
      paddingX={1}
      marginTop={2}
      justifyContent="space-between"
      width="100%"
    >
      <Text color="#c4b5fd">Auto (Off) — all actions require approval · shift+tab cycles</Text>
      <Text color="#c4b5fd">BUSTER Engine</Text>
    </Box>
  );
}

interface ChatInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function ChatInput({ value, placeholder, onChange, onSubmit }: ChatInputProps) {
  return (
    <Box
      borderStyle="single"
      borderColor="#4c1d95"
      paddingX={1}
      width="100%"
      alignItems="center"
      marginTop={1}
    >
      <Text color="#a855f7" bold>
        ❯{' '}
      </Text>
      <TextInput value={value} onChange={onChange} onSubmit={onSubmit} placeholder={placeholder} />
    </Box>
  );
}

export function ChatFooter() {
  return (
    <Box justifyContent="flex-start" marginTop={1}>
      <Text dimColor>? for help</Text>
    </Box>
  );
}

export interface ChatHistoryEntry {
  id: number;
  value: string;
}

interface ChatHistoryProps {
  entries: ChatHistoryEntry[];
}

export function ChatHistory({ entries }: ChatHistoryProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" marginTop={1} width="100%">
      {entries.map((entry) => (
        <Box key={entry.id}>
          <Text color="#e0e7ff">❯ {entry.value}</Text>
        </Box>
      ))}
    </Box>
  );
}
