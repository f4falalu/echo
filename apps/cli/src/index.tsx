#!/usr/bin/env bun
import { program } from 'commander';
import { render } from 'ink';
import React from 'react';
import { Auth } from './commands/auth.js';
import { DeployCommand } from './commands/deploy/deploy.js';
import { DeployOptionsSchema } from './commands/deploy/schemas.js';
import { HelloCommand } from './commands/hello.js';
import { InteractiveCommand } from './commands/interactive.js';
import { Main } from './commands/main.js';

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

// Deploy command - deploy semantic models to Buster API
program
  .command('deploy')
  .description('Deploy semantic models to Buster API')
  .option('--path <path>', 'Path to search for model files (defaults to current directory)')
  .option('--dry-run', 'Validate models without deploying')
  .option('--no-recursive', 'Do not search directories recursively')
  .option('--data-source <name>', 'Override data source name')
  .option('--database <name>', 'Override database name')
  .option('--schema <name>', 'Override schema name')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      // Parse and validate options
      const parsedOptions = DeployOptionsSchema.parse({
        path: options.path,
        dryRun: options.dryRun || false,
        recursive: options.recursive !== false,
        dataSource: options.dataSource,
        database: options.database,
        schema: options.schema,
        verbose: options.verbose || false,
      });

      render(<DeployCommand {...parsedOptions} />);
    } catch (error) {
      console.error('Invalid options:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);
