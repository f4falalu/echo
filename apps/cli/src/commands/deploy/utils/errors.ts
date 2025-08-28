import { ZodError } from 'zod';

/**
 * Custom error class for configuration errors
 */
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public path?: string
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Custom error class for model validation errors
 */
export class ModelValidationError extends Error {
  constructor(
    message: string,
    public model: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ModelValidationError';
  }
}

/**
 * Custom error class for deployment errors
 */
export class DeploymentError extends Error {
  constructor(
    message: string,
    public model: string,
    public response?: unknown
  ) {
    super(message);
    this.name = 'DeploymentError';
  }
}

/**
 * Format error messages with helpful context and suggestions
 */
export function formatDeployError(error: unknown): string {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const issues = error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return `  • ${path}: ${issue.message}`;
      })
      .join('\n');

    return `Validation Error:\n${issues}\n\n💡 Check your YAML syntax and ensure all required fields are present.`;
  }

  // Handle configuration errors
  if (error instanceof ConfigurationError) {
    let message = `Configuration Error: ${error.message}`;
    if (error.path) {
      message += `\n  File: ${error.path}`;
    }
    message += '\n\n💡 Try:\n';
    message += '  1. Check that buster.yml exists and is valid YAML\n';
    message += '  2. Ensure all paths in the config are correct\n';
    message += '  3. Run "buster init" to create a new config';
    return message;
  }

  // Handle model validation errors
  if (error instanceof ModelValidationError) {
    let message = `Model Validation Error in ${error.model}: ${error.message}`;
    if (error.field) {
      message += `\n  Field: ${error.field}`;
    }
    message += '\n\n💡 Common fixes:\n';
    message += '  • Ensure model has a unique name\n';
    message += '  • Add at least one dimension or measure\n';
    message += '  • Check that all required fields are present';
    return message;
  }

  // Handle deployment errors
  if (error instanceof DeploymentError) {
    let message = `Deployment Error for model ${error.model}: ${error.message}`;
    if (error.response) {
      message += `\n  API Response: ${JSON.stringify(error.response, null, 2)}`;
    }
    message += '\n\n💡 Try:\n';
    message += '  1. Check your authentication: buster auth\n';
    message += '  2. Verify the data source exists in Buster\n';
    message += '  3. Check that schema and database values are correct';
    return message;
  }

  // Handle authentication errors
  if (error instanceof Error && error.message.includes('401')) {
    return (
      'Authentication Error: Your API key is invalid or expired\n\n' +
      '💡 Run: buster auth\n' +
      '   to authenticate with your Buster account'
    );
  }

  // Handle network errors
  if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
    return (
      'Connection Error: Unable to connect to Buster API\n\n' +
      '💡 Try:\n' +
      '  1. Check your internet connection\n' +
      '  2. Verify the API URL is correct\n' +
      "  3. If using a local instance, ensure it's running"
    );
  }

  // Handle file not found errors
  if (error instanceof Error && error.message.includes('ENOENT')) {
    const match = error.message.match(/no such file or directory.*'(.+)'/);
    const file = match ? match[1] : 'unknown file';
    return `File Not Found: ${file}\n\n💡 Check that:\n  • The file path is correct\n  • You have permission to read the file\n  • The file exists in the specified location`;
  }

  // Handle permission errors
  if (error instanceof Error && error.message.includes('EACCES')) {
    return (
      'Permission Denied: Cannot access file or directory\n\n' +
      '💡 Try:\n' +
      '  • Check file permissions\n' +
      '  • Run with appropriate permissions\n' +
      '  • Ensure the directory is readable'
    );
  }

  // Handle YAML parsing errors
  if (error instanceof Error && error.message.includes('YAMLException')) {
    return `YAML Parsing Error: ${error.message}\n\n💡 Common YAML issues:\n  • Check indentation (use spaces, not tabs)\n  • Ensure proper syntax for lists and objects\n  • Verify all strings are properly quoted if needed\n  • Look for missing colons or dashes`;
  }

  // Generic error handling
  if (error instanceof Error) {
    return `Error: ${error.message}\n\n💡 For more help, run: buster --help`;
  }

  return `Unknown error occurred: ${String(error)}\n\n💡 Enable debug mode for more details:\n   export BUSTER_DEBUG=1`;
}

/**
 * Exit codes following Unix conventions
 */
export function getExitCode(error: unknown): number {
  if (error instanceof ZodError) {
    return 2; // Misuse of shell command
  }

  if (error instanceof ConfigurationError) {
    return 78; // Configuration error
  }

  if (error instanceof ModelValidationError) {
    return 65; // Data format error
  }

  if (error instanceof DeploymentError) {
    return 75; // Temporary failure
  }

  if (error instanceof Error) {
    if (error.message.includes('401')) {
      return 77; // Permission denied
    }
    if (error.message.includes('ENOENT')) {
      return 66; // Cannot open input
    }
    if (error.message.includes('EACCES')) {
      return 77; // Permission denied
    }
    if (error.message.includes('ECONNREFUSED')) {
      return 68; // Host name unknown
    }
  }

  return 1; // General error
}
