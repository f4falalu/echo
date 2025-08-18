import { createSandbox } from '@buster/sandbox';
import type { Sandbox } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { type DocsAgentContext, DocsAgentContextKey } from '../context/docs-agent-context';

/**
 * Creates a sandbox and sets up the runtime context with optional GitHub token
 * @param runtimeContext - The runtime context to set up
 * @param githubToken - Optional GitHub token to make available in sandbox
 * @returns The created sandbox
 */
export async function createSandboxWithGitHubToken(
  runtimeContext: RuntimeContext<DocsAgentContext>,
  githubToken?: string
): Promise<Sandbox> {
  // Create the sandbox
  const sandbox = await createSandbox({
    language: 'typescript',
  });

  // Set the sandbox in runtime context
  runtimeContext.set(DocsAgentContextKey.Sandbox, sandbox);

  // If GitHub token is provided, set it in the context
  if (githubToken) {
    runtimeContext.set(DocsAgentContextKey.GitHubToken, githubToken);
  }

  return sandbox;
}

/**
 * Helper to set GitHub token in runtime context
 * This can be used when you already have a sandbox and want to add GitHub token
 * @param runtimeContext - The runtime context to update
 * @param token - The GitHub token to set
 */
export function setGitHubTokenInContext(
  runtimeContext: RuntimeContext<DocsAgentContext>,
  token: string
): void {
  runtimeContext.set(DocsAgentContextKey.GitHubToken, token);
}
