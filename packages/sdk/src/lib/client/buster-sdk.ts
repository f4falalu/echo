import type { deploy as deployTypes } from '@buster/server-shared';
import { isApiKeyValid } from '../auth';
import { type SDKConfig, SDKConfigSchema } from '../config';
import { deploy } from '../deploy';

type UnifiedDeployRequest = deployTypes.UnifiedDeployRequest;
type UnifiedDeployResponse = deployTypes.UnifiedDeployResponse;

// Simplified SDK interface - only what the CLI actually uses
export interface BusterSDK {
  readonly config: SDKConfig;
  auth: {
    isApiKeyValid: (apiKey?: string) => Promise<boolean>;
  };
  deploy: (request: UnifiedDeployRequest) => Promise<UnifiedDeployResponse>;
}

// Create SDK instance
export function createBusterSDK(config: Partial<SDKConfig>): BusterSDK {
  // Validate config with Zod
  const validatedConfig = SDKConfigSchema.parse(config);

  return {
    config: validatedConfig,
    auth: {
      isApiKeyValid: (apiKey?: string) => isApiKeyValid(validatedConfig, apiKey),
    },
    deploy: (request) => deploy(validatedConfig, request),
  };
}
