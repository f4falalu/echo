import { Box, Text, useApp, useInput } from 'ink';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChatFooter,
  type ChatHistoryEntry,
  ChatInput,
  ChatIntroText,
  ChatTitle,
  ChatVersionTagline,
  VimStatus,
} from '../components/chat-layout';
import { HistoryBrowser } from '../components/history-browser';
import { AgentMessageComponent } from '../components/message';
import { SettingsForm } from '../components/settings-form';
import type { DocsAgentMessage } from '../services/analytics-engineer-handler';
import type { Conversation } from '../utils/conversation-history';
import { loadConversation, saveMessage } from '../utils/conversation-history';
import { getCurrentChatId, initNewSession, setSessionChatId } from '../utils/session';
import { getSetting } from '../utils/settings';
import type { SlashCommand } from '../utils/slash-commands';
import type { VimMode } from '../utils/vim-mode';

type AppMode = 'Planning' | 'Auto-accept' | 'None';

export function Main() {
  const { exit } = useApp();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const [messages, setMessages] = useState<DocsAgentMessage[]>([]);
  const historyCounter = useRef(0);
  const messageCounter = useRef(0);
  const [vimEnabled, setVimEnabled] = useState(() => getSetting('vimMode'));
  const [currentVimMode, setCurrentVimMode] = useState<VimMode>('insert');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('None');
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const workingDirectory = useRef(process.cwd());

  // Initialize a fresh session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        // Always start with a fresh session
        initNewSession();
        setSessionInitialized(true);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        setSessionInitialized(true); // Continue anyway
      }
    };

    initSession();
  }, []);

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

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !sessionInitialized) {
      setInput('');
      return;
    }

    const chatId = getCurrentChatId();
    const cwd = workingDirectory.current;

    const userMessage: DocsAgentMessage = {
      id: ++messageCounter.current,
      message: {
        kind: 'user',
        content: trimmed,
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Save user message to history
    await saveMessage(chatId, cwd, userMessage.id, userMessage.message);

    // Import and run the docs agent
    const { runDocsAgent } = await import('../services/analytics-engineer-handler');

    // Run agent - callbacks will handle message display
    await runDocsAgent({
      chatId,
      userMessage: trimmed,
      onMessage: async (agentMessage) => {
        // Assign unique ID to each message
        const messageWithId = {
          id: ++messageCounter.current,
          message: agentMessage.message,
        };
        setMessages((prev) => [...prev, messageWithId]);

        // Save agent message to history
        await saveMessage(chatId, cwd, messageWithId.id, messageWithId.message);
      },
    });
  }, [input, sessionInitialized]);

  const handleResumeConversation = useCallback(async (conversation: Conversation) => {
    try {
      // Load the conversation messages
      const loadedMessages: DocsAgentMessage[] = conversation.messages.map((stored) => ({
        id: stored.id,
        message: stored.message,
      }));

      // Update message counter to highest ID
      messageCounter.current = Math.max(...loadedMessages.map((m) => m.id), 0);

      // Update session to use this conversation's chat ID
      setSessionChatId(conversation.chatId);

      // Clear existing messages and load the selected conversation
      setMessages(loadedMessages);
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to resume conversation:', error);
      setShowHistory(false);
    }
  }, []);

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
        case 'history':
          setShowHistory(true);
          break;
        case 'help': {
          historyCounter.current += 1;
          const helpEntry: ChatHistoryEntry = {
            id: historyCounter.current,
            value:
              'Available commands:\n/settings - Configure app settings\n/clear - Clear chat history\n/history - Browse and resume previous conversations\n/exit - Exit the app\n/help - Show this help',
          };
          setHistory((prev) => [...prev, helpEntry].slice(-5));
          break;
        }
      }
    },
    [exit]
  );

  // Memoize message list to prevent re-renders from cursor blinking
  // MUST be before conditional returns to satisfy React's rules of hooks
  const messageList = useMemo(() => {
    return messages.map((msg) => <AgentMessageComponent key={msg.id} message={msg.message} />);
  }, [messages]);

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

  if (showHistory) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={2}>
        <HistoryBrowser
          workingDirectory={workingDirectory.current}
          onSelect={handleResumeConversation}
          onCancel={() => setShowHistory(false)}
        />
      </Box>
    );
  }

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
