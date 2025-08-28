import type { ValidateApiKeyResponse } from '@buster/server-shared';
import { isApiKeyValid, validateApiKey } from '../auth';
import { type SDKConfig, SDKConfigSchema } from '../config';
import { get } from '../http';

// SDK instance interface
export interface BusterSDK {
  readonly config: SDKConfig;
  healthcheck: () => Promise<{ status: string; [key: string]: unknown }>;
  auth: {
    validateApiKey: (apiKey?: string) => Promise<ValidateApiKeyResponse>;
    isApiKeyValid: (apiKey?: string) => Promise<boolean>;
  };
}

// Create SDK instance
export function createBusterSDK(config: Partial<SDKConfig>): BusterSDK {
  // Validate config with Zod
  const validatedConfig = SDKConfigSchema.parse(config);

  return {
    config: validatedConfig,
    healthcheck: () => get(validatedConfig, '/api/healthcheck'),
    auth: {
      validateApiKey: (apiKey?: string) => validateApiKey(validatedConfig, apiKey),
      isApiKeyValid: (apiKey?: string) => isApiKeyValid(validatedConfig, apiKey),
    },
  };
}
