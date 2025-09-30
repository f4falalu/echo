import { Box, useApp, useInput } from 'ink';
import { useRef, useState } from 'react';
import {
  ChatFooter,
  ChatHistory,
  type ChatHistoryEntry,
  ChatInput,
  ChatIntroText,
  ChatStatusBar,
  ChatTitle,
  ChatVersionTagline,
} from '../components/chat-layout';

export function Main() {
  const { exit } = useApp();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const historyCounter = useRef(0);

  useInput((value, key) => {
    if (key.ctrl && value === 'c') {
      exit();
    }
  });

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setInput('');
      return;
    }

    historyCounter.current += 1;
    const entry: ChatHistoryEntry = {
      id: historyCounter.current,
      value: trimmed,
    };

    setHistory((prev) => {
      const next = [...prev, entry];
      return next.slice(-5);
    });
    setInput('');
  };

  return (
    <Box flexDirection="column" paddingX={4} paddingY={2} gap={1}>
      <ChatTitle />
      <ChatVersionTagline />
      <ChatIntroText />
      <ChatStatusBar />
      <ChatHistory entries={history} />
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder='Try "Review the changes in my current branch"'
      />
      <ChatFooter />
    </Box>
  );
}
