import type { Command } from 'commander';
import { createAuthCommand } from './auth';
import { createDeployCommand } from './deploy';
import { createInitCommand } from './init';
import { createSettingsCommand } from './settings';
import { createUpdateCommand } from './update';

/**
 * Registers all CLI subcommands with the program
 */
export function registerCommands(program: Command): void {
  program.addCommand(createAuthCommand());
  program.addCommand(createDeployCommand());
  program.addCommand(createInitCommand());
  program.addCommand(createSettingsCommand());
  program.addCommand(createUpdateCommand());
}
