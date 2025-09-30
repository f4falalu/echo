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
import { TypedMessage, type MessageType } from '../components/typed-message';
import { getSetting } from '../utils/settings';
import type { SlashCommand } from '../utils/slash-commands';
import type { VimMode } from '../utils/vim-mode';

type AppMode = 'Planning' | 'Auto-accept' | 'None';

interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  messageType?: MessageType;
  metadata?: string;
}

export function Main() {
  const { exit } = useApp();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const historyCounter = useRef(0);
  const messageCounter = useRef(0);
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

  const getMockResponse = (userInput: string): Message[] => {
    const responses: Message[] = [];
    
    // Always send all message types for demo
    responses.push(
      {
        id: ++messageCounter.current,
        type: 'assistant',
        content: 'Creating a comprehensive plan for your request.',
        messageType: 'PLAN',
        metadata: 'Updated: 3 total (3 pending, 0 in progress, 0 completed)'
      },
      {
        id: ++messageCounter.current,
        type: 'assistant',
        content: 'Executing command: npm install',
        messageType: 'EXECUTE',
        metadata: 'cd /project && npm install, impact: low'
      },
      {
        id: ++messageCounter.current,
        type: 'assistant',
        content: 'Searching for documentation and best practices...',
        messageType: 'WEB_SEARCH',
        metadata: '"React hooks useState useEffect"'
      },
      {
        id: ++messageCounter.current,
        type: 'assistant',
        content: 'Here is some general information about your request.',
        messageType: 'INFO'
      },
      {
        id: ++messageCounter.current,
        type: 'assistant',
        content: 'Successfully completed all operations!',
        messageType: 'SUCCESS'
      },
      {
        id: ++messageCounter.current,
        type: 'assistant',
        content: 'Warning: This operation may take longer than expected.',
        messageType: 'WARNING'
      },
      {
        id: ++messageCounter.current,
        type: 'assistant',
        content: 'Error: Failed to connect to the database.',
        messageType: 'ERROR'
      },
      {
        id: ++messageCounter.current,
        type: 'assistant',
        content: 'Debug: Variable state = { isLoading: true, data: null }',
        messageType: 'DEBUG',
        metadata: 'Line 42 in main.tsx'
      }
    );
    
    return responses;
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setInput('');
      return;
    }

    messageCounter.current += 1;
    const userMessage: Message = {
      id: messageCounter.current,
      type: 'user',
      content: trimmed,
    };

    const mockResponses = getMockResponse(trimmed);
    
    setMessages((prev) => [...prev, userMessage, ...mockResponses]);
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
      <Box flexDirection="column" marginTop={1}>
        {messages.map((message) => {
          if (message.type === 'user') {
            return (
              <Box key={message.id} marginBottom={1}>
                <Text color="#a855f7" bold>❯ </Text>
                <Text color="#e0e7ff">{message.content}</Text>
              </Box>
            );
          } else if (message.messageType) {
            return (
              <TypedMessage
                key={message.id}
                type={message.messageType}
                content={message.content}
                metadata={message.metadata}
              />
            );
          } else {
            return (
              <Box key={message.id} marginBottom={1}>
                <Text color="#e0e7ff">{message.content}</Text>
              </Box>
            );
          }
        })}
      </Box>
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
