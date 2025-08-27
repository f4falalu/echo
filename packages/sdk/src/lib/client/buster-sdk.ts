import { type SDKConfig, SDKConfigSchema } from '../config';
import { get } from '../http';

// SDK instance interface
export interface BusterSDK {
  readonly config: SDKConfig;
  healthcheck: () => Promise<{ status: string; [key: string]: unknown }>;
}

// Create SDK instance
export function createBusterSDK(config: Partial<SDKConfig>): BusterSDK {
  // Validate config with Zod
  const validatedConfig = SDKConfigSchema.parse(config);

  return {
    config: validatedConfig,
    healthcheck: () => get(validatedConfig, '/api/healthcheck'),
  };
}
