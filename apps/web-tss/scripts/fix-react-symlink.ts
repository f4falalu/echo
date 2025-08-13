#!/usr/bin/env node
import { existsSync, rmSync, symlinkSync } from 'fs';
import { join } from 'path';

/**
 * Fix React symlink in the production build to ensure React 19 is used
 * This script runs after the build to correct any incorrect symlinks
 * 
 * Equivalent to running:
 * cd .output/server/node_modules
 * rm react
 * ln -s .nitro/react@19.1.1 react
 */
async function fixReactSymlink() {
  // Get the path to .output/server/node_modules from the root of the app
  const nodeModulesDir = join(process.cwd(), '.output', 'server', 'node_modules');
  const reactPath = join(nodeModulesDir, 'react');
  
  console.log('🔧 Fixing React symlink in production build...');
  
  // Check if the output directory exists
  if (!existsSync(nodeModulesDir)) {
    console.log('✅ No output directory found, skipping symlink fix');
    return;
  }
  
  // Remove react directory/symlink if it exists (equivalent to: rm react)
  if (existsSync(reactPath)) {
    rmSync(reactPath, { recursive: true, force: true });
    console.log('🗑️  Removed react');
  }
  
  // Create symlink to .nitro/react@19.1.1 (equivalent to: ln -s .nitro/react@19.1.1 react)
  // Note: The symlink target is relative to the node_modules directory
  symlinkSync('.nitro/react@19.1.1', reactPath);
  console.log('✅ Created symlink: react -> .nitro/react@19.1.1');
  
  console.log('✨ React symlink fix complete!');
}

// Run the fix
fixReactSymlink().catch((error) => {
  console.error('❌ Error fixing React symlink:', error);
  process.exit(1);
});
