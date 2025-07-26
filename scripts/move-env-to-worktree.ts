#!/usr/bin/env tsx

import { promises as fs } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { glob } from 'glob';

const SOURCE_REPO = join(process.env.HOME!, 'buster', 'buster');
const TARGET_REPO = process.cwd();

async function copyEnvFiles() {
  try {
    console.info(`Searching for .env files in ${SOURCE_REPO}...`);
    
    const envFiles = await glob('**/.env*', {
      cwd: SOURCE_REPO,
      absolute: false,
      dot: true,
      ignore: ['**/node_modules/**', '**/.git/**']
    });

    if (envFiles.length === 0) {
      console.warn('No .env files found in source repository');
      return;
    }

    console.info(`Found ${envFiles.length} .env file(s)`);

    for (const envFile of envFiles) {
      const sourcePath = join(SOURCE_REPO, envFile);
      const targetPath = join(TARGET_REPO, envFile);
      const targetDir = dirname(targetPath);

      console.info(`Copying ${envFile}...`);

      try {
        await fs.mkdir(targetDir, { recursive: true });
        
        const content = await fs.readFile(sourcePath, 'utf-8');
        await fs.writeFile(targetPath, content);
        
        console.info(`  ✓ Copied to ${relative(TARGET_REPO, targetPath)}`);
      } catch (error) {
        console.error(`  ✗ Failed to copy ${envFile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.info('\nDone! All .env files have been copied to the worktree.');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

copyEnvFiles();