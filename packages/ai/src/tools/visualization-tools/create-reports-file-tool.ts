import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

interface CreateReportsParams {
  name: string;
  code: string;
}

interface CreateReportsOutput {
  success: boolean;
  message: string;
  file: {
    id: string;
    name: string;
    code: string;
  };
}

// Main create reports function
const createReportsFile = wrapTraced(
  async ({
    params,
    runtimeContext,
  }: {
    params: CreateReportsParams;
    runtimeContext: RuntimeContext;
  }): Promise<CreateReportsOutput> => {
    // Dummy implementation - just return success
    const dummyId = `report_${Date.now()}`;

    runtimeContext.set(dummyId, params.code);

    return {
      success: true,
      message: `Successfully created report: ${params.name}`,
      file: {
        id: dummyId,
        name: params.name,
        code: params.code,
      },
    };
  },
  { name: 'create-reports-file' }
);

// Export the tool
export const createReports = createTool({
  id: 'create-reports',
  description: 'Create a new report with markdown content',
  inputSchema: z.object({
    name: z.string().describe('The name of the report'),
    code: z.string().describe('The markdown code for the report'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    file: z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
    }),
  }),
  execute: async ({ context, runtimeContext }) => {
    return await createReportsFile({
      params: context as CreateReportsParams,
      runtimeContext,
    });
  },
});
