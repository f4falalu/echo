#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { program } from 'commander';
import { HelloCommand } from './commands/hello.js';
import { InteractiveCommand } from './commands/interactive.js';

// CLI metadata
program
  .name('buster')
  .description('Buster CLI - TypeScript version')
  .version('0.1.0');

// Hello command - basic example
program
  .command('hello')
  .description('Say hello')
  .argument('[name]', 'Name to greet', 'World')
  .option('-u, --uppercase', 'Output in uppercase')
  .action(async (name: string, options: { uppercase?: boolean }) => {
    render(<HelloCommand name={name} uppercase={options.uppercase} />);
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

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}