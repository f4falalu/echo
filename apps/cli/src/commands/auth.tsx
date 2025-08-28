import { createBusterSDK } from '@buster/sdk';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import React, { useState, useEffect } from 'react';
import {
  type Credentials,
  deleteCredentials,
  getCredentials,
  loadCredentials,
  saveCredentials,
} from '../utils/credentials.js';

interface AuthProps {
  apiKey?: string;
  host?: string;
  local?: boolean;
  cloud?: boolean;
  clear?: boolean;
  noSave?: boolean;
}

const DEFAULT_HOST = 'https://api2.buster.so';
const LOCAL_HOST = 'http://localhost:3001';

export function Auth({ apiKey, host, local, cloud, clear, noSave }: AuthProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<'clear' | 'prompt' | 'validate' | 'save' | 'done'>('clear');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hostInput, setHostInput] = useState('');
  const [_error, setError] = useState<string | null>(null);
  const [_existingCreds, setExistingCreds] = useState<Credentials | null>(null);
  const [finalCreds, setFinalCreds] = useState<Credentials | null>(null);

  // Handle clear flag
  useEffect(() => {
    if (clear) {
      deleteCredentials()
        .then(() => {
          console.log('✅ Credentials cleared successfully');
          exit();
        })
        .catch((err: Error) => {
          console.error('❌ Failed to clear credentials:', err.message);
          exit();
        });
    } else {
      setStep('prompt');
    }
  }, [clear, exit]);

  // Load existing credentials
  useEffect(() => {
    if (step === 'prompt') {
      loadCredentials().then((creds) => {
        setExistingCreds(creds);

        // Determine the host to use
        let targetHost = DEFAULT_HOST;
        if (local) targetHost = LOCAL_HOST;
        else if (cloud) targetHost = DEFAULT_HOST;
        else if (host) targetHost = host;
        else if (creds?.apiUrl) targetHost = creds.apiUrl;

        setHostInput(targetHost);
        setApiKeyInput(apiKey || '');

        // If we have all required info from args, skip to validation
        if (apiKey) {
          setFinalCreds({ apiKey, apiUrl: targetHost });
          setStep('validate');
        }
      });
    }
  }, [step, apiKey, host, local, cloud]);

  // Handle input completion
  useInput((_input, key) => {
    if (key.return && step === 'prompt') {
      if (!hostInput) {
        setError('Host URL is required');
        return;
      }
      if (!apiKeyInput) {
        setError('API key is required');
        return;
      }

      setFinalCreds({ apiKey: apiKeyInput, apiUrl: hostInput });
      setStep('validate');
    }
  });

  // Validate credentials
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
            setStep(noSave ? 'done' : 'save');
          } else {
            setError('Invalid API key');
            setStep('prompt');
          }
        })
        .catch((err: Error) => {
          setError(`Validation failed: ${err.message}`);
          setStep('prompt');
        });
    }
  }, [step, finalCreds, noSave]);

  // Save credentials
  useEffect(() => {
    if (step === 'save' && finalCreds) {
      saveCredentials(finalCreds)
        .then(() => {
          setStep('done');
        })
        .catch((err: Error) => {
          setError(`Failed to save: ${err.message}`);
          setStep('done');
        });
    }
  }, [step, finalCreds]);

  // Display success and exit
  useEffect(() => {
    if (step === 'done' && finalCreds) {
      const masked = finalCreds.apiKey.length > 6 ? `****${finalCreds.apiKey.slice(-6)}` : '****';

      console.log("\n✅ You've successfully connected to Buster!\n");
      console.log('Connection details:');
      console.log(`  host: ${finalCreds.apiUrl}`);
      console.log(`  api_key: ${masked}`);

      if (!noSave && step === 'done') {
        console.log('\nCredentials saved successfully!');
      } else if (noSave) {
        console.log('\nNote: Credentials were not saved due to --no-save flag');
      }

      exit();
    }
  }, [step, finalCreds, noSave, exit]);

  // Render based on current step
  if (step === 'clear') {
    return <Text>Clearing credentials...</Text>;
  }

  if (step === 'prompt') {
    return (
      <Box flexDirection='column'>
        {_existingCreds && (
          <Text color='yellow'>⚠️ Existing credentials found. They will be overwritten.</Text>
        )}

        {_error && <Text color='red'>❌ {_error}</Text>}

        <Box marginY={1}>
          <Text>Enter the URL of your Buster API (default: {DEFAULT_HOST}): </Text>
        </Box>
        <TextInput value={hostInput} onChange={setHostInput} placeholder={DEFAULT_HOST} />

        <Box marginY={1}>
          <Text>Enter your API key: </Text>
        </Box>
        <TextInput value={apiKeyInput} onChange={setApiKeyInput} mask='*' />

        <Box marginTop={1}>
          <Text dimColor>
            Find your API key at {hostInput || DEFAULT_HOST}/app/settings/api-keys
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text dimColor>Press Enter when ready to continue</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'validate') {
    return (
      <Box>
        <Text>
          <Spinner type='dots' /> Validating API key...
        </Text>
      </Box>
    );
  }

  if (step === 'save') {
    return (
      <Box>
        <Text>
          <Spinner type='dots' /> Saving credentials...
        </Text>
      </Box>
    );
  }

  return null;
}
