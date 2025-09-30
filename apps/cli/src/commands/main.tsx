import { Box, Text, useApp, useInput } from 'ink';
import { useRef, useState } from 'react';
import {
  ChatFooter,
  ChatHistory,
  type ChatHistoryEntry,
  ChatInput,
  ChatIntroText,
  ChatTitle,
  ChatVersionTagline,
  VimStatus,
} from '../components/chat-layout';
import { SettingsForm } from '../components/settings-form';
import { getSetting } from '../utils/settings';
import type { SlashCommand } from '../utils/slash-commands';
import type { VimMode } from '../utils/vim-mode';

type AppMode = 'Planning' | 'Auto-accept' | 'None';

export function Main() {
  const { exit } = useApp();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const historyCounter = useRef(0);
  const [vimEnabled, setVimEnabled] = useState(() => getSetting('vimMode'));
  const [currentVimMode, setCurrentVimMode] = useState<VimMode>('insert');
  const [showSettings, setShowSettings] = useState(false);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('None');

  useInput((value, key) => {
    if (key.ctrl && value === 'c') {
      exit();
    }
    
    // Cycle through modes with shift+tab
    if (key.shift && key.tab) {
      setAppMode((current) => {
        switch (current) {
          case 'None':
            return 'Planning';
          case 'Planning':
            return 'Auto-accept';
          case 'Auto-accept':
            return 'None';
        }
      });
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
      <Box flexDirection="column" paddingX={1} paddingY={2}>
        <SettingsForm onClose={() => {
          setShowSettings(false);
          // Refresh vim enabled setting after settings close
          setVimEnabled(getSetting('vimMode'));
        }} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingY={2} gap={1}>
      <ChatTitle />
      <ChatVersionTagline />
      <ChatIntroText />
      <ChatHistory entries={history} />
      <Box flexDirection="column">
        <Box height={1}>
          {appMode !== 'None' && (
            <Text color="#c4b5fd" bold>
              {appMode === 'Planning' ? 'Planning Mode' : 'Auto-accept Mode'}
            </Text>
          )}
        </Box>
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder='Try "Review the changes in my current branch"'
          onVimModeChange={setCurrentVimMode}
          onCommandExecute={handleCommandExecute}
          onAutocompleteStateChange={setIsAutocompleteOpen}
        />
        <Box justifyContent="space-between">
          <VimStatus 
            vimMode={currentVimMode} 
            vimEnabled={vimEnabled} 
            hideWhenAutocomplete={isAutocompleteOpen}
          />
          <ChatFooter />
        </Box>
      </Box>
    </Box>
  );
}
