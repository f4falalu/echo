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
  VimStatus,
} from '../components/chat-layout';
import { SettingsForm } from '../components/settings-form';
import { getSetting } from '../utils/settings';
import type { SlashCommand } from '../utils/slash-commands';
import type { VimMode } from '../utils/vim-mode';

export function Main() {
  const { exit } = useApp();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const historyCounter = useRef(0);
  const [vimEnabled] = useState(() => getSetting('vimMode'));
  const [currentVimMode, setCurrentVimMode] = useState<VimMode>('insert');
  const [showSettings, setShowSettings] = useState(false);

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

  const handleCommandExecute = (command: SlashCommand) => {
    switch (command.action) {
      case 'settings':
        setShowSettings(true);
        break;
      case 'clear':
        setHistory([]);
        break;
      case 'exit':
        exit();
        break;
      case 'help': {
        historyCounter.current += 1;
        const helpEntry: ChatHistoryEntry = {
          id: historyCounter.current,
          value:
            'Available commands:\n/settings - Configure app settings\n/clear - Clear chat history\n/exit - Exit the app\n/help - Show this help',
        };
        setHistory((prev) => [...prev, helpEntry].slice(-5));
        break;
      }
    }
  };

  if (showSettings) {
    return (
      <Box flexDirection="column" paddingX={4} paddingY={2}>
        <SettingsForm onClose={() => setShowSettings(false)} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={4} paddingY={2} gap={1}>
      <ChatTitle />
      <ChatVersionTagline />
      <ChatIntroText />
      <ChatStatusBar />
      <ChatHistory entries={history} />
      <Box flexDirection="column">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder='Try "Review the changes in my current branch"'
          onVimModeChange={setCurrentVimMode}
          onCommandExecute={handleCommandExecute}
        />
        <VimStatus vimMode={currentVimMode} vimEnabled={vimEnabled} />
      </Box>
      <ChatFooter />
    </Box>
  );
}
