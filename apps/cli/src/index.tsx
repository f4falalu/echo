#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { program } from 'commander';
import { Main } from './commands/main.js';
import { Auth } from './commands/auth.js';
import { HelloCommand } from './commands/hello.js';
import { InteractiveCommand } from './commands/interactive.js';

// CLI metadata
program
  .name('buster')
  .description('Buster CLI - AI-powered data analytics platform')
  .version('0.1.0')
  .action(() => {
    // Default action when no subcommand is provided
    render(<Main />);
  });

// Auth command - authentication management
program
  .command('auth')
  .description('Authenticate with Buster API')
  .option('--api-key <key>', 'Your Buster API key')
  .option('--host <url>', 'Custom API host URL')
  .option('--local', 'Use local development server (http://localhost:3001)')
  .option('--cloud', 'Use cloud instance (https://api2.buster.so)')
  .option('--clear', 'Clear saved credentials')
  .option('--no-save', "Don't save credentials to disk")
  .action(async (options) => {
    render(<Auth {...options} />);
  });

// Hello command - basic example
program
  .command('hello')
  .description('Say hello')
  .argument('[name]', 'Name to greet', 'World')
  .option('-u, --uppercase', 'Output in uppercase')
  .action(async (name: string, options: { uppercase?: boolean }) => {
    render(<HelloCommand name={name} uppercase={options.uppercase || false} />);
  });

// Interactive command - demonstrates Ink's capabilities
program
  .command('interactive')
  .description('Run an interactive demo')
  .action(async () => {
    render(<InteractiveCommand />);
  });

// Parse command line arguments
program.parse(process.argv);