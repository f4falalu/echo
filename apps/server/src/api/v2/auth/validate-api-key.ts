import { getApiKeyDetails, validateApiKey } from '@buster/database';
import type { ValidateApiKeyRequest, ValidateApiKeyResponse } from '@buster/server-shared';

/**
 * Handler for validating an API key
 * @param request - The validation request containing the API key
 * @returns Promise<ValidateApiKeyResponse> - Response with validation status and details
 */
export async function validateApiKeyHandler(
  request: ValidateApiKeyRequest
): Promise<ValidateApiKeyResponse> {
  try {
    // First check if the API key is valid
    const isValid = await validateApiKey(request.apiKey);

    if (!isValid) {
      return {
        valid: false,
      };
    }

    // If valid, get the details
    const details = await getApiKeyDetails(request.apiKey);

    if (!details) {
      // This shouldn't happen if validateApiKey returned true, but handle it
      return {
        valid: false,
      };
    }

    return {
      valid: true,
      organizationId: details.organizationId,
      ownerId: details.ownerId,
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    // Don't expose internal errors to the client
    return {
      valid: false,
    };
  }
}
