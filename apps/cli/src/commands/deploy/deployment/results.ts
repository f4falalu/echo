import { relative } from 'node:path';
import type { CLIDeploymentResult, DeployResponse, DeploymentExcluded, Model } from '../schemas';

/**
 * Pure function to merge multiple deployment results into one
 */
export function mergeDeploymentResults(results: CLIDeploymentResult[]): CLIDeploymentResult {
  return results.reduce(
    (acc, result) => ({
      success: [...acc.success, ...result.success],
      updated: [...acc.updated, ...result.updated],
      noChange: [...acc.noChange, ...result.noChange],
      failures: [...acc.failures, ...result.failures],
      excluded: [...acc.excluded, ...result.excluded],
      todos: [...acc.todos, ...(result.todos || [])],
    }),
    {
      success: [],
      updated: [],
      noChange: [],
      failures: [],
      excluded: [],
      todos: [],
    }
  );
}

/**
 * Pure function to process deployment response into CLI result format
 */
export function processDeploymentResponse(
  response: DeployResponse,
  modelFileMap: Map<string, string>
): CLIDeploymentResult {
  const result: CLIDeploymentResult = {
    success: [],
    updated: [],
    noChange: [],
    failures: [],
    excluded: [],
    todos: [],
  };

  // Process successful deployments
  for (const item of response.success) {
    result.success.push({
      file: modelFileMap.get(item.name) || 'unknown',
      modelName: item.name,
      dataSource: item.dataSource,
    });
  }

  // Process updated deployments
  for (const item of response.updated) {
    result.updated.push({
      file: modelFileMap.get(item.name) || 'unknown',
      modelName: item.name,
      dataSource: item.dataSource,
    });
  }

  // Process unchanged deployments
  for (const item of response.noChange) {
    result.noChange.push({
      file: modelFileMap.get(item.name) || 'unknown',
      modelName: item.name,
      dataSource: item.dataSource,
    });
  }

  // Process failures
  for (const failure of response.failures) {
    result.failures.push({
      file: modelFileMap.get(failure.name) || 'unknown',
      modelName: failure.name,
      errors: failure.errors,
    });
  }

  return result;
}

/**
 * Pure function to format deployment summary for display
 */
export function formatDeploymentSummary(result: CLIDeploymentResult, verbose = false, isDryRun = false): string {
  const lines: string[] = [];
  
  // Calculate totals
  const totalSuccess = result.success.length + result.updated.length + result.noChange.length;
  const totalFailed = result.failures.length;
  const totalTodos = result.todos?.length || 0;
  const totalExcluded = result.excluded.length;

  // Header with mode indicator
  lines.push('');
  lines.push(isDryRun ? 'Deployment Results (DRY RUN)' : 'Deployment Results');
  lines.push('─'.repeat(29));
  
  // Models deployed summary
  if (totalSuccess > 0) {
    lines.push(`  ${totalSuccess} models deployed`);
    if (result.success.length > 0) {
      lines.push(`    • ${result.success.length} new`);
    }
    if (result.updated.length > 0) {
      lines.push(`    • ${result.updated.length} updated`);
    }
    if (result.noChange.length > 0) {
      lines.push(`    • ${result.noChange.length} unchanged`);
    }
  } else if (totalFailed === 0 && totalTodos === 0) {
    lines.push('  No models to deploy');
  }
  
  // Failures section
  if (totalFailed > 0) {
    lines.push('');
    lines.push(`  ${totalFailed} models failed:`);
    
    // Group failures by file
    const failuresByFile = new Map<string, typeof result.failures>();
    for (const failure of result.failures) {
      const existing = failuresByFile.get(failure.file) || [];
      existing.push(failure);
      failuresByFile.set(failure.file, existing);
    }
    
    // Show failures
    const maxFiles = verbose ? failuresByFile.size : 3;
    let fileCount = 0;
    
    for (const [file, failures] of failuresByFile) {
      if (fileCount >= maxFiles) break;
      fileCount++;
      
      // Extract just the filename for cleaner output (unless verbose)
      const displayName = verbose ? file : (file.split('/').pop() || file);
      lines.push(`    ${displayName}`);
      
      for (const failure of failures) {
        // Show first error per model in non-verbose mode
        const maxErrors = verbose ? failure.errors.length : 1;
        for (let i = 0; i < maxErrors; i++) {
          const error = extractErrorMessage(failure.errors[i]);
          lines.push(`      • ${error}`);
        }
        
        if (!verbose && failure.errors.length > 1) {
          lines.push(`      ... and ${failure.errors.length - 1} more error${failure.errors.length - 1 === 1 ? '' : 's'}`);
        }
      }
    }
    
    if (failuresByFile.size > maxFiles) {
      lines.push(`    ... and ${failuresByFile.size - maxFiles} more`);
    }
  }
  
  // TODOs section
  if (totalTodos > 0) {
    lines.push('');
    lines.push(`  ${totalTodos} files need completion:`);
    
    const maxTodos = verbose ? result.todos.length : 5;
    for (let i = 0; i < Math.min(maxTodos, result.todos.length); i++) {
      // Show full paths in verbose mode, just filename otherwise
      const displayPath = verbose 
        ? result.todos[i].file
        : (result.todos[i].file.split('/').pop() || result.todos[i].file);
      lines.push(`    ${displayPath}`);
    }
    
    if (result.todos.length > maxTodos) {
      lines.push(`    ... and ${result.todos.length - maxTodos} more`);
    }
  }
  
  // Excluded section (only in verbose mode)
  if (verbose && totalExcluded > 0) {
    lines.push('');
    lines.push(`  ${totalExcluded} files excluded:`);
    
    for (const excluded of result.excluded) {
      // Show full paths in verbose mode
      const displayName = verbose ? excluded.file : (excluded.file.split('/').pop() || excluded.file);
      lines.push(`    ${displayName}: ${excluded.reason}`);
    }
  }
  
  // Final status line
  lines.push('');
  if (totalFailed > 0) {
    const mode = isDryRun ? 'Dry run' : 'Deployment';
    lines.push(`✗ ${mode} completed with ${totalFailed} error${totalFailed === 1 ? '' : 's'}`);
    if (!verbose) {
      lines.push('  Run with --verbose for full error details');
    }
  } else if (totalTodos > 0) {
    const mode = isDryRun ? 'Dry run' : 'Deployment';
    lines.push(`⚠ ${mode} completed with ${totalTodos} file${totalTodos === 1 ? '' : 's'} needing completion`);
  } else if (totalSuccess === 0) {
    lines.push('⚠ No models found to deploy');
  } else {
    const mode = isDryRun ? 'Dry run' : 'Deployment';
    lines.push(`✓ ${mode} completed successfully`);
  }
  
  return lines.join('\n');
}

/**
 * Extract meaningful error message from verbose database errors
 */
function extractErrorMessage(error: string): string {
  // Handle SQL update errors with large parameter lists
  if (error.includes('Failed query:')) {
    // Try to extract just the error reason after the params
    const paramsMatch = error.match(/params:.*?([A-Z][^,]*error[^,]*)/i);
    if (paramsMatch?.[1]) {
      return paramsMatch[1].trim();
    }

    // Look for common database error patterns
    if (error.includes('duplicate key')) {
      return 'Duplicate key error - model may already exist';
    }
    if (error.includes('foreign key')) {
      return 'Foreign key constraint violation';
    }
    if (error.includes('not null')) {
      return 'Required field is missing (NOT NULL constraint)';
    }
    if (error.includes('unique constraint')) {
      return 'Unique constraint violation';
    }

    // If it's a long query error, just show the first part
    const lines = error.split('\n');
    if (lines[0].length > 100) {
      return lines[0].substring(0, 100) + '...';
    }
    return lines[0];
  }

  // For other errors, truncate if too long
  if (error.length > 150) {
    return error.substring(0, 150) + '...';
  }

  return error;
}

/**
 * Display deployment result in CLI
 */
export function displayDeploymentResults(result: CLIDeploymentResult, verbose = false, isDryRun = false): void {
  const summary = formatDeploymentSummary(result, verbose, isDryRun);
  console.info(summary);
}

/**
 * Create model-to-file mapping from deployment data
 */
export function createModelFileMap(
  fileModels: Array<{ file: string; models: Model[] }>
): Map<string, string> {
  const map = new Map<string, string>();

  for (const { file, models } of fileModels) {
    for (const model of models) {
      map.set(model.name, file);
    }
  }

  return map;
}

/**
 * Convert parse failures to CLI deployment failures
 */
export function createParseFailures(
  failures: Array<{ file: string; error: string }>,
  baseDir: string
): Array<{ file: string; modelName: string; errors: string[] }> {
  return failures.map((failure) => ({
    file: failure.file.includes('/') ? relative(baseDir, failure.file) : failure.file,
    modelName: 'parse_error',
    errors: [failure.error],
  }));
}