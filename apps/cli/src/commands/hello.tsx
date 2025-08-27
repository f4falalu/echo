import React, { useEffect } from 'react';
import { Text, Box } from 'ink';
import chalk from 'chalk';

interface HelloCommandProps {
  name: string;
  uppercase?: boolean;
}

export const HelloCommand: React.FC<HelloCommandProps> = ({ name, uppercase }) => {
  const greeting = `Hello, ${name}!`;
  const displayText = uppercase ? greeting.toUpperCase() : greeting;

  useEffect(() => {
    // Exit after rendering
    setTimeout(() => {
      process.exit(0);
    }, 100);
  }, []);

  return (
    <Box flexDirection="column">
      <Text color="green">
        {chalk.bold('🚀 Buster CLI')}
      </Text>
      <Text>
        {displayText}
      </Text>
    </Box>
  );
};