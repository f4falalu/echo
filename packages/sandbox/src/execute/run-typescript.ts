import type { Daytona, Sandbox } from '@daytonaio/sdk';
import { z } from 'zod';

// Define schema for TypeScript execution options
const runTypescriptOptionsSchema = z.object({
  argv: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  timeout: z.number().optional(),
});

export type RunTypeScriptOptions = z.infer<typeof runTypescriptOptionsSchema>;

// Define schema for the response
const codeRunResponseSchema = z.object({
  result: z.string(),
  exitCode: z.number().optional(),
  stderr: z.string().optional(),
});

export type CodeRunResponse = z.infer<typeof codeRunResponseSchema>;

/**
 * Executes TypeScript code in a Daytona sandbox
 * @param sandbox - The Daytona sandbox instance
 * @param code - The TypeScript code to execute
 * @param options - Optional execution options (argv, env, timeout)
 * @returns The execution result
 */
export async function runTypescript(
  sandbox: Sandbox, // Will be typed properly once we know the exact Daytona sandbox type
  code: string,
  options?: RunTypeScriptOptions
): Promise<CodeRunResponse> {
  // Validate options if provided
  const validatedOptions = options ? runTypescriptOptionsSchema.parse(options) : undefined;

  try {
    // Execute the TypeScript code using the sandbox's codeRun method
    const response = await sandbox.process.codeRun(
      code,
      validatedOptions
        ? {
            ...(validatedOptions.argv && { argv: validatedOptions.argv }),
            ...(validatedOptions.env && { env: validatedOptions.env }),
          }
        : undefined,
      validatedOptions?.timeout
    );

    // Validate and return the response
    return codeRunResponseSchema.parse(response);
  } catch (error) {
    // Handle execution errors
    if (error instanceof Error) {
      throw new Error(`TypeScript execution failed: ${error.message}`);
    }
    throw new Error('TypeScript execution failed with unknown error');
  }
}
