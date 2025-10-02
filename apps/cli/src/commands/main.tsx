import { Box, Text, useApp, useInput } from 'ink';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
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
import { Diff } from '../components/diff';
import { SettingsForm } from '../components/settings-form';
import { type MessageType, TypedMessage } from '../components/typed-message';
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
  diffLines?: Array<{
    lineNumber: number;
    content: string;
    type: 'add' | 'remove' | 'context';
  }>;
  fileName?: string;
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

    if (userInput.toLowerCase().includes('plan')) {
      responses.push({
        id: ++messageCounter.current,
        type: 'assistant',
        content: `I'll create a detailed plan for your request. Let me analyze the requirements and break down the implementation steps.`,
        messageType: 'PLAN',
        metadata: 'Creating a comprehensive plan for your request.',
      });
    } else if (userInput.toLowerCase().includes('search')) {
      responses.push({
        id: ++messageCounter.current,
        type: 'assistant',
        content: 'Searching for relevant information across the web...',
        messageType: 'EXECUTE',
        metadata: 'Executing command: npm install',
      });
    } else if (userInput.toLowerCase().includes('run')) {
      responses.push({
        id: ++messageCounter.current,
        type: 'assistant',
        content: `cd /Users/safzan/Development/insideim/jobai-backend && node --env-file=.env --input-type=module --import=axios`,
        messageType: 'EXECUTE',
        metadata: 'React hooks useState useEffect',
      });
    } else if (userInput.toLowerCase().includes('error')) {
      responses.push({
        id: ++messageCounter.current,
        type: 'assistant',
        content: 'Writing new configuration file...',
        messageType: 'WRITE',
        metadata:
          '/Users/safzan/Development/insideim/cheating-daddy/node_modules/@google/genai, impact: medium',
      });
    } else {
      // Default response with EDIT and diff visualization
      responses.push({
        id: ++messageCounter.current,
        type: 'assistant',
        content: 'Editing the file with the requested changes',
        messageType: 'EDIT',
        fileName: '/src/components/typed-message.tsx',
        diffLines: [
          {
            lineNumber: 62,
            content: 'const getMockResponse = (userInput: string): Message[] => {',
            type: 'context',
          },
          { lineNumber: 63, content: '  const responses: Message[] = [];', type: 'context' },
          { lineNumber: 64, content: '', type: 'context' },
          {
            lineNumber: 65,
            content: "  if (userInput.toLowerCase().includes('plan')) {",
            type: 'remove',
          },
          { lineNumber: 66, content: '    responses.push({', type: 'remove' },
          { lineNumber: 65, content: '  // Always send all message types for demo', type: 'add' },
          { lineNumber: 66, content: '  responses.push(', type: 'add' },
          { lineNumber: 67, content: '    {', type: 'add' },
          { lineNumber: 68, content: '      id: ++messageCounter.current,', type: 'context' },
          { lineNumber: 69, content: "      type: 'assistant',", type: 'context' },
          {
            lineNumber: 70,
            content:
              "      content: 'I\\'ll create a detailed plan for your request. Let me analyze the requirements and break down the implementation steps.',",
            type: 'remove',
          },
          {
            lineNumber: 70,
            content: "      content: 'Creating a comprehensive plan for your request.',",
            type: 'add',
          },
          { lineNumber: 71, content: "      messageType: 'PLAN',", type: 'context' },
          {
            lineNumber: 72,
            content: "      metadata: 'Updated: 3 total (3 pending, 0 in progress, 0 completed)'",
            type: 'context',
          },
          { lineNumber: 73, content: '    })', type: 'remove' },
          { lineNumber: 73, content: '    },', type: 'add' },
          {
            lineNumber: 74,
            content: "  } else if (userInput.toLowerCase().includes('search')) {",
            type: 'remove',
          },
          { lineNumber: 75, content: '    responses.push({', type: 'remove' },
          { lineNumber: 74, content: '    {', type: 'add' },
          { lineNumber: 75, content: '      id: ++messageCounter.current,', type: 'add' },
          { lineNumber: 76, content: "      type: 'assistant',", type: 'add' },
          {
            lineNumber: 77,
            content: "      content: 'Searching for relevant information across the web...',",
            type: 'remove',
          },
          {
            lineNumber: 77,
            content: "      content: 'Executing command: npm install',",
            type: 'add',
          },
          { lineNumber: 78, content: "      messageType: 'EXECUTE',", type: 'add' },
          {
            lineNumber: 79,
            content: "      metadata: 'cd /project && npm install, impact: low'",
            type: 'add',
          },
          { lineNumber: 80, content: '    },', type: 'add' },
          { lineNumber: 81, content: '    {', type: 'add' },
          { lineNumber: 82, content: '      id: ++messageCounter.current,', type: 'add' },
          { lineNumber: 83, content: "      type: 'assistant',", type: 'add' },
          {
            lineNumber: 84,
            content: "      content: 'Searching for documentation and best practices...',",
            type: 'add',
          },
          { lineNumber: 85, content: "      messageType: 'WEB_SEARCH',", type: 'remove' },
          {
            lineNumber: 86,
            content: '      metadata: \'"site:github.com generativelanguage auth_tokens.proto"\'',
            type: 'remove',
          },
          { lineNumber: 87, content: '    });', type: 'remove' },
          {
            lineNumber: 88,
            content: "  } else if (userInput.toLowerCase().includes('run')) {",
            type: 'remove',
          },
          { lineNumber: 88, content: '  } else {', type: 'add' },
          { lineNumber: 89, content: '', type: 'context' },
          { lineNumber: 90, content: '', type: 'context' },
          {
            lineNumber: 91,
            content: "      metadata: 'React hooks useState useEffect'",
            type: 'remove',
          },
          {
            lineNumber: 91,
            content:
              "      content: 'cd /Users/safzan/Development/insideim/jobai-backend && node --env-file=.env --input-type=module --import=axios',",
            type: 'add',
          },
          { lineNumber: 92, content: "      messageType: 'EXECUTE',", type: 'remove' },
          {
            lineNumber: 93,
            content:
              "      metadata: 'ls /Users/safzan/Development/insideim/cheating-daddy/node_modules/@google/genai, impact: medium'",
            type: 'remove',
          },
          { lineNumber: 94, content: '    }));', type: 'remove' },
          {
            lineNumber: 95,
            content: "  } else if (userInput.toLowerCase().includes('error')) {",
            type: 'remove',
          },
        ],
      });
    }

    return responses;
  };

  const handleSubmit = useCallback(async () => {
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

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Import and run the docs agent
    const { runDocsAgent } = await import('../services/analytics-engineer-handler');

    await runDocsAgent({
      userMessage: trimmed,
      onMessage: (agentMessage) => {
        messageCounter.current += 1;
        setMessages((prev) => [
          ...prev,
          {
            id: messageCounter.current,
            type: agentMessage.type,
            content: agentMessage.content,
            messageType: agentMessage.messageType,
            metadata: agentMessage.metadata,
          },
        ]);
      },
    });
  }, [input]);

  const handleCommandExecute = useCallback(
    (command: SlashCommand) => {
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
    },
    [exit]
  );

  if (showSettings) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={2}>
        <SettingsForm
          onClose={() => {
            setShowSettings(false);
            // Refresh vim enabled setting after settings close
            setVimEnabled(getSetting('vimMode'));
          }}
        />
      </Box>
    );
  }

  // Memoize message list to prevent re-renders from cursor blinking
  const messageList = useMemo(() => {
    return messages.map((message) => {
      if (message.type === 'user') {
        return (
          <Box key={message.id} marginBottom={1}>
            <Text color="#a855f7" bold>
              ❯{' '}
            </Text>
            <Text color="#e0e7ff">{message.content}</Text>
          </Box>
        );
      } else if (message.messageType) {
        return (
          <Box key={message.id} flexDirection="column">
            <TypedMessage
              type={message.messageType}
              content={message.content}
              metadata={message.metadata}
            />
            {message.diffLines && <Diff lines={message.diffLines} fileName={message.fileName} />}
          </Box>
        );
      } else {
        return (
          <Box key={message.id} marginBottom={1}>
            <Text color="#e0e7ff">{message.content}</Text>
          </Box>
        );
      }
    });
  }, [messages]);

  return (
    <Box flexDirection="column" paddingX={1} paddingY={2} gap={1}>
      <ChatTitle />
      <ChatVersionTagline />
      <ChatIntroText />
      <Box flexDirection="column" marginTop={1}>
        {messageList}
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
