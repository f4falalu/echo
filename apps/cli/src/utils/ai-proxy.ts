import { z } from 'zod';

const ProxyConfigSchema = z.object({
  baseURL: z.string().url().describe('Base URL for the AI proxy endpoint'),
});

export type ProxyConfig = z.infer<typeof ProxyConfigSchema>;

/**
 * Gets the AI proxy configuration for the CLI
 *
 * Priority order:
 * 1. BUSTER_AI_PROXY_URL environment variable
 * 2. Saved credentials apiUrl from ~/.buster/credentials.json
 * 3. Default to localhost:3002 for local development
 */
export async function getProxyConfig(): Promise<ProxyConfig> {
  const { getCredentials } = await import('./credentials');
  const creds = await getCredentials();

  // Check for AI proxy-specific URL (highest priority)
  const proxyUrl = process.env.BUSTER_AI_PROXY_URL;

  if (proxyUrl) {
    return ProxyConfigSchema.parse({ baseURL: proxyUrl });
  }

  // Fall back to regular API URL from credentials
  if (creds?.apiUrl) {
    return ProxyConfigSchema.parse({ baseURL: creds.apiUrl });
  }

  // Default to localhost for development
  return ProxyConfigSchema.parse({ baseURL: 'http://localhost:3002' });
}
