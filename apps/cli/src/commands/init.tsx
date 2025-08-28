import { createBusterSDK } from '@buster/sdk';
import { Box, Text, useApp, useInput } from 'ink';
import BigText from 'ink-big-text';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import React, { useState, useEffect } from 'react';
import { type Credentials, hasCredentials, saveCredentials } from '../utils/credentials.js';

interface InitProps {
  apiKey?: string;
  host?: string;
  local?: boolean;
  skipBanner?: boolean;
}

const DEFAULT_HOST = 'https://api2.buster.so';
const LOCAL_HOST = 'http://localhost:3001';

// Component for the welcome screen
function WelcomeScreen() {
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

export function Init({ apiKey, host, local, skipBanner }: InitProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<'check' | 'prompt' | 'validate' | 'save' | 'done'>('check');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hostInput, setHostInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [finalCreds, setFinalCreds] = useState<Credentials | null>(null);
  const [showBanner] = useState(!skipBanner);

  // Check for existing credentials
  useEffect(() => {
    if (step === 'check') {
      hasCredentials().then((hasCreds) => {
        if (hasCreds) {
          console.log('\n✅ You already have Buster configured!');
          console.log('\nTo reconfigure, run: buster auth');
          exit();
        } else {
          // Set default host based on flags
          let targetHost = DEFAULT_HOST;
          if (local) targetHost = LOCAL_HOST;
          else if (host) targetHost = host;

          setHostInput(targetHost);
          setApiKeyInput(apiKey || '');

          // If API key provided via args, skip to validation
          if (apiKey) {
            setFinalCreds({ apiKey, apiUrl: targetHost });
            setStep('validate');
          } else {
            setStep('prompt');
          }
        }
      });
    }
  }, [step, apiKey, host, local, exit]);

  // Handle input
  useInput((_input, key) => {
    if (key.return && step === 'prompt' && apiKeyInput) {
      setFinalCreds({
        apiKey: apiKeyInput,
        apiUrl: hostInput || DEFAULT_HOST,
      });
      setStep('validate');
    }
  });

  // Validate API key
  useEffect(() => {
    if (step === 'validate' && finalCreds) {
      const sdk = createBusterSDK({
        apiKey: finalCreds.apiKey,
        apiUrl: finalCreds.apiUrl,
        timeout: 30000,
      });

      sdk.auth
        .isApiKeyValid()
        .then((valid: boolean) => {
          if (valid) {
            setStep('save');
          } else {
            setError('Invalid API key. Please check your key and try again.');
            setStep('prompt');
            setApiKeyInput('');
          }
        })
        .catch((err: Error) => {
          setError(`Connection failed: ${err.message}`);
          setStep('prompt');
        });
    }
  }, [step, finalCreds]);

  // Save credentials
  useEffect(() => {
    if (step === 'save' && finalCreds) {
      saveCredentials(finalCreds)
        .then(() => {
          setStep('done');
        })
        .catch((err: Error) => {
          console.error('Failed to save credentials:', err.message);
          setStep('done');
        });
    }
  }, [step, finalCreds]);

  // Show success message and exit
  useEffect(() => {
    if (step === 'done' && finalCreds) {
      const masked = finalCreds.apiKey.length > 6 ? `****${finalCreds.apiKey.slice(-6)}` : '****';

      console.log('\n🎉 Welcome to Buster!\n');
      console.log("✅ You've successfully connected to Buster!\n");
      console.log('Connection details:');
      console.log(`  host: ${finalCreds.apiUrl}`);
      console.log(`  api_key: ${masked}`);
      console.log('\nYour credentials have been saved.');
      console.log('\n📚 Get started:');
      console.log('  buster --help    Show available commands');
      console.log('  buster auth      Reconfigure authentication');

      exit();
    }
  }, [step, finalCreds, exit]);

  // Render based on step - always show welcome screen at the top if enabled
  return (
    <Box flexDirection='column'>
      {showBanner && <WelcomeScreen />}

      {step === 'check' && (
        <Box>
          <Text>
            <Spinner type='dots' /> Checking configuration...
          </Text>
        </Box>
      )}

      {step === 'prompt' && (
        <Box flexDirection='column'>
          <Box marginBottom={1}>
            <Text>Let's get you connected to Buster.</Text>
          </Box>

          {error && (
            <Box marginBottom={1}>
              <Text color='red'>❌ {error}</Text>
            </Box>
          )}

          {!apiKey && !host && !local && (
            <Box marginBottom={1}>
              <Text>API URL: {hostInput}</Text>
              <Text dimColor> (Press Enter to use default)</Text>
            </Box>
          )}

          <Box marginBottom={1}>
            <Text>Enter your API key: </Text>
          </Box>

          <TextInput value={apiKeyInput} onChange={setApiKeyInput} mask='*' placeholder='sk_...' />

          <Box marginTop={1}>
            <Text dimColor>Find your API key at {hostInput}/app/settings/api-keys</Text>
          </Box>

          <Box marginTop={1}>
            <Text dimColor>Press Enter to continue</Text>
          </Box>
        </Box>
      )}

      {step === 'validate' && (
        <Box>
          <Text>
            <Spinner type='dots' /> Validating your API key...
          </Text>
        </Box>
      )}

      {step === 'save' && (
        <Box>
          <Text>
            <Spinner type='dots' /> Saving your configuration...
          </Text>
        </Box>
      )}
    </Box>
  );
}
