import { createVertexAnthropic } from '@ai-sdk/google-vertex/anthropic';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import { wrapAISDKModel } from 'braintrust';

export const vertexModel = (modelId: string): LanguageModelV1 => {
  // Create a proxy that validates credentials on first use
  let actualModel: LanguageModelV1 | null = null;

  const getActualModel = () => {
    if (!actualModel) {
      const clientEmail = process.env.VERTEX_CLIENT_EMAIL;
      let privateKey = process.env.VERTEX_PRIVATE_KEY;
      const project = process.env.VERTEX_PROJECT;

      if (!clientEmail || !privateKey || !project) {
        throw new Error(
          'Missing required environment variables: VERTEX_CLIENT_EMAIL or VERTEX_PRIVATE_KEY'
        );
      }

      // Handle escaped newlines in private key
      privateKey = privateKey.replace(/\\n/g, '\n');

      const vertex = createVertexAnthropic({
        baseURL: `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/anthropic/models`,
        location: 'global',
        project,
        googleAuthOptions: {
          credentials: {
            client_email: clientEmail,
            private_key: privateKey,
          },
        },
        headers: {
          'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
        },
        fetch: ((url, options) => {
          if (options?.body) {
            try {
              // Parse existing body if it's a string
              const existingBody =
                typeof options.body === 'string' ? JSON.parse(options.body) : options.body;

              // Append disable_parallel_tool_use if tool_choice is present
              const modifiedBody = {
                ...existingBody,
              };

              if (modifiedBody.tool_choice) {
                modifiedBody.tool_choice = {
                  ...modifiedBody.tool_choice,
                  disable_parallel_tool_use: true,
                };
              }

              // Return modified options
              return fetch(url, {
                ...options,
                body: JSON.stringify(modifiedBody),
              });
            } catch (error) {
              console.error('Failed to parse request body:', error);
              // If body parsing fails, fall back to original request
              return fetch(url, options);
            }
          }

          // For requests without body, pass through unchanged
          return fetch(url, options);
        }) as typeof fetch,
      });

      // Wrap the model with Braintrust tracing
      actualModel = wrapAISDKModel(vertex(modelId));
    }
    return actualModel;
  };

  // Create a proxy that delegates all calls to the actual model
  return new Proxy({} as LanguageModelV1, {
    get(_target, prop) {
      const model = getActualModel();
      return Reflect.get(model, prop);
    },
  });
};
