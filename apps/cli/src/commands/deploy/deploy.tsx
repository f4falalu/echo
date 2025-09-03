import { Box, Text } from 'ink';
import React, { useEffect, useState } from 'react';
import { Spinner } from '../../components/spinner';
import { DeployProgress } from './components/deploy-progress';
import { DeploySummary } from './components/deploy-summary';
import { deployHandler, validateDeployOptions } from './deploy-handler';
import type { CLIDeploymentResult, DeployOptions } from './schemas';

interface DeployCommandProps extends DeployOptions {}

/**
 * Main deploy command UI component
 * Orchestrates the deployment process with visual feedback
 */
export function DeployCommand(props: DeployCommandProps) {
  const [status, setStatus] = useState<'initializing' | 'deploying' | 'complete' | 'error'>(
    'initializing'
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CLIDeploymentResult | null>(null);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    currentFile: '',
    currentModel: '',
    statusMessage: 'Initializing...',
  });

  useEffect(() => {
    // Start the deployment process
    runDeployment();
  }, []);

  const runDeployment = async () => {
    try {
      // Validate options
      setStatus('initializing');
      const validation = validateDeployOptions(props);
      if (!validation.valid) {
        throw new Error(`Invalid options: ${validation.errors.join(', ')}`);
      }

      // Add a small delay to show the spinner
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Run deployment
      setStatus('deploying');
      setProgress({
        ...progress,
        statusMessage: 'Starting deployment...',
      });

      // Execute the deployment handler
      const deploymentResult = await deployHandler(props);

      // Set result and complete
      setResult(deploymentResult);
      setStatus('complete');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // Error state
  if (status === 'error') {
    // Check if it's a buster.yml not found error
    const isBusterYmlError = error?.includes('No buster.yml found');

    if (isBusterYmlError) {
      return (
        <Box flexDirection='column'>
          <Text color='red'>No buster.yml found</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection='column'>
        <Text color='red' bold>
          ❌ Deployment Error
        </Text>
        <Text color='red'>{error}</Text>
        <Box marginTop={1}>
          <Text color='dim'>Please check your configuration and try again.</Text>
        </Box>
      </Box>
    );
  }

  // Deploying state
  if (status === 'deploying') {
    return (
      <DeployProgress
        current={progress.current}
        total={progress.total}
        currentFile={progress.currentFile}
        currentModel={progress.currentModel}
        status={progress.statusMessage}
        isComplete={false}
      />
    );
  }

  // Complete state
  if (status === 'complete' && result) {
    return <DeploySummary result={result} />;
  }

  // Initializing state - show spinner
  return (
    <Box flexDirection='column'>
      <Spinner label='Loading configuration...' />
    </Box>
  );
}
