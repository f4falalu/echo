import * as child_process from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface RgCommand {
  command: string;
}

interface RgResult {
  success: boolean;
  command: string;
  stdout?: string;
  stderr?: string;
  error?: string;
}

// Check if rg is available
function checkRgAvailable(): boolean {
  try {
    child_process.execSync('which rg', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function executeRgCommand(command: string): Promise<RgResult> {
  return new Promise((resolve) => {
    child_process.exec(
      command,
      {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: 30000, // 30 second timeout
      },
      (error: child_process.ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          // Exit code 1 means no matches found, which is not an error for rg
          if (error.code === 1) {
            resolve({
              success: true,
              command,
              stdout: '',
              stderr: stderr || '',
            });
            return;
          }

          resolve({
            success: false,
            command,
            error: `Command failed with exit code ${error.code}: ${stderr || error.message}`,
            stderr: stderr || '',
          });
          return;
        }

        resolve({
          success: true,
          command,
          stdout,
          stderr: stderr || '',
        });
      }
    );
  });
}

async function executeRgCommands(commands: RgCommand[]): Promise<RgResult[]> {
  const promises = commands.map((cmd) => executeRgCommand(cmd.command));
  return Promise.all(promises);
}

// Script execution
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Extract commands from args
  // Expected format: JSON array of command objects (possibly base64 encoded)
  if (args.length === 0) {
    console.log(JSON.stringify([]));
    return;
  }

  // Check if rg is available
  if (!checkRgAvailable()) {
    console.log(
      JSON.stringify([
        {
          success: false,
          command: 'unknown',
          error: 'ripgrep (rg) is not installed or not available in PATH',
        },
      ])
    );
    return;
  }

  try {
    let commandsJson = args[0] || '[]';

    // Try to decode from base64 if it looks like base64
    if (commandsJson && /^[A-Za-z0-9+/]+=*$/.test(commandsJson) && commandsJson.length % 4 === 0) {
      try {
        commandsJson = Buffer.from(commandsJson, 'base64').toString('utf-8');
      } catch {
        // If base64 decode fails, use as-is
      }
    }

    const commands = JSON.parse(commandsJson);

    if (!Array.isArray(commands)) {
      console.log(
        JSON.stringify([
          {
            success: false,
            command: 'unknown',
            error: 'Invalid input: expected array of commands',
          },
        ])
      );
      return;
    }

    const results = await executeRgCommands(commands);

    // Output as JSON to stdout
    console.log(JSON.stringify(results));
  } catch (error) {
    console.log(
      JSON.stringify([
        {
          success: false,
          command: 'unknown',
          error: `Failed to parse input: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ])
    );
  }
}

// Run the script
main().catch((error) => {
  console.error(
    JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
    })
  );
  process.exit(1);
});
