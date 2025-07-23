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
