import { createBusterSDK } from '@buster/sdk';
import { Box, Text, useApp, useInput } from 'ink';
import BigText from 'ink-big-text';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import React, { useState, useEffect } from 'react';
import {
  type Credentials,
  getCredentials,
  hasCredentials,
  saveCredentials,
} from '../utils/credentials.js';

const DEFAULT_HOST = 'https://api2.buster.so';
const _LOCAL_HOST = 'http://localhost:3001';

// Component for the welcome screen header
function WelcomeHeader() {
  return (
    <Box paddingY={2} paddingX={2} alignItems='center'>
      <Box marginRight={4}>
        <Text color='#7C3AED'>
          <BigText text='BUSTER' font='block' />
        </Text>
      </Box>
      <Box flexDirection='column' justifyContent='center'>
        <Text bold>Welcome to Buster</Text>
        <Box marginTop={1}>
          <Text dimColor>Type / to use slash commands</Text>
        </Box>
        <Box>
          <Text dimColor>Type @ to mention files</Text>
        </Box>
        <Box>
          <Text dimColor>Ctrl-C to exit</Text>
        </Box>
        <Box marginTop={2}>
          <Text dimColor>/help for more</Text>
        </Box>
        <Box marginTop={2}>
          <Text color='#7C3AED'>"Run `buster` and fix all the errors"</Text>
        </Box>
      </Box>
    </Box>
  );
}

// Input box component for authenticated users
function CommandInput({ onSubmit }: { onSubmit: (input: string) => void }) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <Box paddingX={2} paddingBottom={1}>
      <Box borderStyle='single' borderColor='#7C3AED' paddingX={1} width='100%'>
        <Text color='#7C3AED'>❯ </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder='Enter a command or question...'
        />
      </Box>
    </Box>
  );
}

// Auth prompt component for unauthenticated users
function AuthPrompt({ onAuth }: { onAuth: (creds: Credentials) => void }) {
  const [apiKey, setApiKey] = useState('');
  const [host] = useState(DEFAULT_HOST);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const sdk = createBusterSDK({
        apiKey: apiKey.trim(),
        apiUrl: host,
        timeout: 30000,
      });

      const isValid = await sdk.auth.isApiKeyValid();

      if (isValid) {
        const creds = { apiKey: apiKey.trim(), apiUrl: host };
        await saveCredentials(creds);
        onAuth(creds);
      } else {
        setError('Invalid API key. Please check your key and try again.');
        setApiKey('');
      }
    } catch (err) {
      setError(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setValidating(false);
    }
  };

  if (validating) {
    return (
      <Box paddingX={2}>
        <Text>
          <Spinner type='dots' /> Validating your API key...
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection='column' paddingX={2}>
      <Box marginBottom={1}>
        <Text>Let's get you connected to Buster.</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color='red'>❌ {error}</Text>
        </Box>
      )}

      <Box marginBottom={1}>
        <Text>Enter your API key: </Text>
      </Box>

      <Box borderStyle='single' borderColor='#7C3AED' paddingX={1}>
        <TextInput
          value={apiKey}
          onChange={setApiKey}
          onSubmit={handleSubmit}
          mask='*'
          placeholder='sk_...'
        />
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Find your API key at {host}/app/settings/api-keys</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press Enter to continue</Text>
      </Box>
    </Box>
  );
}

export function Main() {
  const { exit } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [_credentials, setCredentials] = useState<Credentials | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const creds = await getCredentials();

        if (creds?.apiKey) {
          // Validate the stored credentials
          const sdk = createBusterSDK({
            apiKey: creds.apiKey,
            apiUrl: creds.apiUrl,
            timeout: 30000,
          });

          const isValid = await sdk.auth.isApiKeyValid();

          if (isValid) {
            setCredentials(creds);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (_error) {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Handle keyboard shortcuts
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
  });

  const handleAuth = (creds: Credentials) => {
    setCredentials(creds);
    setIsAuthenticated(true);
  };

  const handleCommand = (command: string) => {
    setCommandHistory([...commandHistory, command]);

    // Handle special commands
    if (command === '/help') {
      console.info('\nAvailable commands:');
      console.info('  /help    - Show this help message');
      console.info('  /clear   - Clear the screen');
      console.info('  /exit    - Exit the CLI');
      console.info('\nFor more information, visit https://docs.buster.so');
    } else if (command === '/clear') {
      console.clear();
    } else if (command === '/exit') {
      exit();
    } else {
      // TODO: Process the command with Buster
      console.info(`Processing: ${command}`);
      console.info('Command processing not yet implemented.');
    }
  };

  if (checkingAuth) {
    return (
      <Box flexDirection='column'>
        <WelcomeHeader />
        <Box paddingX={2}>
          <Text>
            <Spinner type='dots' /> Checking configuration...
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection='column'>
      <WelcomeHeader />

      {/* Show command history if authenticated */}
      {isAuthenticated && commandHistory.length > 0 && (
        <Box flexDirection='column' paddingX={2} marginBottom={1}>
          {commandHistory.slice(-5).map((cmd, idx) => (
            <Box key={`cmd-${idx}-${cmd}`}>
              <Text dimColor>❯ {cmd}</Text>
            </Box>
          ))}
        </Box>
      )}

      {isAuthenticated ? (
        <CommandInput onSubmit={handleCommand} />
      ) : (
        <AuthPrompt onAuth={handleAuth} />
      )}
    </Box>
  );
}
