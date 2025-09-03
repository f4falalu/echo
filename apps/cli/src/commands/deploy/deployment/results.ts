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
    }),
    {
      success: [],
      updated: [],
      noChange: [],
      failures: [],
      excluded: [],
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
export function formatDeploymentSummary(result: CLIDeploymentResult, verbose = false): string {
  const lines: string[] = [];

  lines.push('📊 Deployment Summary');
  lines.push('='.repeat(40));

  const totalDeployed = result.success.length + result.updated.length;
  lines.push(`✅ Successfully deployed: ${totalDeployed} models`);

  if (result.success.length > 0) {
    lines.push(`  ✨ New models: ${result.success.length}`);
  }

  if (result.updated.length > 0) {
    lines.push(`  🔄 Updated models: ${result.updated.length}`);
  }

  if (result.noChange.length > 0) {
    lines.push(`  ➖ No changes: ${result.noChange.length}`);
  }

  if (result.excluded.length > 0) {
    lines.push(`⛔ Excluded: ${result.excluded.length} files`);
  }

  if (result.failures.length > 0) {
    lines.push(`❌ Failed: ${result.failures.length} models`);
    lines.push('-'.repeat(40));

    // Show first 5 failures in detail, then summarize the rest
    const maxDetailedFailures = verbose ? result.failures.length : 5;
    const detailedFailures = result.failures.slice(0, maxDetailedFailures);
    const remainingCount = result.failures.length - maxDetailedFailures;

    for (const failure of detailedFailures) {
      lines.push('');
      lines.push(`  File: ${failure.file}`);
      lines.push(`  Model: ${failure.modelName}`);
      for (const error of failure.errors) {
        if (verbose) {
          // Show full error in verbose mode
          lines.push(`    • Full error: ${error}`);
        } else {
          // Extract meaningful error message from verbose SQL errors
          const cleanedError = extractErrorMessage(error);
          lines.push(`    • ${cleanedError}`);
        }
      }
    }

    if (remainingCount > 0) {
      lines.push(`...and ${remainingCount} more failures`);
      if (!verbose) {
        lines.push('(Run with --verbose to see all error details)');
      }
    }
  }

  lines.push('='.repeat(40));

  if (result.failures.length === 0) {
    lines.push('🎉 All models processed successfully!');
  } else {
    lines.push('');
    lines.push('⚠️  Some models failed to deploy. Please check the errors above.');
    if (!verbose && result.failures.length > 0) {
      lines.push('💡 Tip: Run with --verbose flag to see full error details');
    }
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
    if (paramsMatch && paramsMatch[1]) {
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
    if (error.includes('syntax error')) {
      return 'SQL syntax error in model definition';
    }
    if (error.includes('permission denied')) {
      return 'Permission denied for database operation';
    }
    if (error.includes('connection')) {
      return 'Database connection error';
    }
    
    // If we can't extract a specific error, show a generic message
    return 'Database update failed - check model definition and permissions';
  }
  
  // For non-SQL errors, truncate if too long
  if (error.length > 200) {
    // Try to find the actual error message part
    const errorParts = error.split(':');
    if (errorParts.length > 1) {
      // Return the last meaningful part (often the actual error)
      const lastPart = errorParts[errorParts.length - 1];
      if (lastPart) {
        return lastPart.trim().substring(0, 150) + '...';
      }
    }
    return error.substring(0, 150) + '...';
  }
  
  return error;
}

/**
 * Pure function to create parse failure entries
 */
export function createParseFailures(
  failures: Array<{ file: string; error: string }>,
  baseDir: string
): CLIDeploymentResult['failures'] {
  return failures.map(({ file, error }) => ({
    file: relative(baseDir, file),
    modelName: 'parse_error',
    errors: [error],
  }));
}

/**
 * Pure function to create exclusion entries
 */
export function createExclusions(
  excluded: DeploymentExcluded[],
  baseDir: string
): DeploymentExcluded[] {
  return excluded.map((item) => ({
    file: relative(baseDir, item.file),
    reason: item.reason,
  }));
}

/**
 * Pure function to calculate deployment statistics
 */
export function calculateDeploymentStats(result: CLIDeploymentResult): {
  totalModels: number;
  successRate: number;
  hasFailures: boolean;
  hasExclusions: boolean;
} {
  const totalModels =
    result.success.length + result.updated.length + result.noChange.length + result.failures.length;

  const successCount = result.success.length + result.updated.length + result.noChange.length;

  return {
    totalModels,
    successRate: totalModels > 0 ? (successCount / totalModels) * 100 : 0,
    hasFailures: result.failures.length > 0,
    hasExclusions: result.excluded.length > 0,
  };
}

/**
 * Pure function to group results by project
 */
export function groupResultsByProject(
  results: Array<{ project: string; result: CLIDeploymentResult }>
): Map<string, CLIDeploymentResult> {
  const map = new Map<string, CLIDeploymentResult>();

  for (const { project, result } of results) {
    map.set(project, result);
  }

  return map;
}

/**
 * Pure function to filter successful deployments
 */
export function filterSuccessfulDeployments(
  result: CLIDeploymentResult
): Pick<CLIDeploymentResult, 'success' | 'updated' | 'noChange'> {
  return {
    success: result.success,
    updated: result.updated,
    noChange: result.noChange,
  };
}

/**
 * Pure function to filter failed deployments
 */
export function filterFailedDeployments(
  result: CLIDeploymentResult
): Pick<CLIDeploymentResult, 'failures' | 'excluded'> {
  return {
    failures: result.failures,
    excluded: result.excluded,
  };
}
