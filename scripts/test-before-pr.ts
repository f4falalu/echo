#!/usr/bin/env tsx

import { execSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

interface Step {
  name: string;
  command: string;
  emoji: string;
  description: string;
}

const steps: Step[] = [
  {
    name: 'lint',
    command: 'turbo run lint --ui=stream',
    emoji: '🔍',
    description: 'Running linter checks'
  },
  {
    name: 'build',
    command: 'turbo run build --ui=stream',
    emoji: '🏗️',
    description: 'Building all packages'
  },
  {
    name: 'test',
    command: 'turbo run test',
    emoji: '🧪',
    description: 'Running all tests'
  }
];

function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

function runStep(step: Step, stepNumber: number, totalSteps: number): boolean {
  console.log(`\n${step.emoji} [${stepNumber}/${totalSteps}] ${step.description}...`);
  console.log(`📝 Command: ${step.command}`);
  
  const startTime = performance.now();
  
  try {
    execSync(step.command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    const endTime = performance.now();
    const duration = formatTime(endTime - startTime);
    
    console.log(`✅ ${step.name} completed successfully in ${duration}`);
    return true;
  } catch (error) {
    const endTime = performance.now();
    const duration = formatTime(endTime - startTime);
    
    console.log(`❌ ${step.name} failed after ${duration}`);
    console.error(`💥 Error in ${step.name}:`, error);
    return false;
  }
}

function main() {
  console.log('🚀 Starting pre-PR checks...\n');
  console.log('🎯 This will run: lint → build → test');
  console.log('⏱️  Grab a coffee, this might take a while!\n');
  console.log('═'.repeat(50));
  
  const overallStartTime = performance.now();
  let failedSteps: string[] = [];
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const success = runStep(step, i + 1, steps.length);
    
    if (!success) {
      failedSteps.push(step.name);
      break; // Stop on first failure
    }
  }
  
  const overallEndTime = performance.now();
  const totalDuration = formatTime(overallEndTime - overallStartTime);
  
  console.log('\n' + '═'.repeat(50));
  
  if (failedSteps.length === 0) {
    console.log('🎉 All pre-PR checks passed!');
    console.log('✨ Your code is ready for review!');
    console.log(`⏰ Total time: ${totalDuration}`);
    console.log('🚢 Safe to create that PR! 🚢');
    process.exit(0);
  } else {
    console.log('💥 Pre-PR checks failed!');
    console.log(`❌ Failed steps: ${failedSteps.join(', ')}`);
    console.log(`⏰ Total time: ${totalDuration}`);
    console.log('🔧 Please fix the issues above before creating a PR.');
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Pre-PR checks interrupted by user');
  console.log('👋 See you next time!');
  process.exit(130);
});

main(); 