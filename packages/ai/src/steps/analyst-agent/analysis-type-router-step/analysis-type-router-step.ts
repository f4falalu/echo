import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { generateObject } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepWorkflowInputSchema } from '../../../schemas/workflow-schemas';
import { Haiku35 } from '../../../utils/models/haiku-3-5';
import { appendToConversation, standardizeMessages } from '../../../utils/standardizeMessages';
import type { AnalystRuntimeContext } from '../../../workflows/analyst-workflow';

const inputSchema = thinkAndPrepWorkflowInputSchema;

// Define the analysis type choices
const AnalysisTypeEnum = z.enum(['standard', 'investigation']);

// Define the structure for the AI response
const analysisTypeSchema = z.object({
  choice: AnalysisTypeEnum.describe('The type of analysis to perform'),
  reasoning: z.string().describe('Explanation for why this analysis type was chosen'),
});

const outputSchema = z.object({
  analysisType: analysisTypeSchema,
  conversationHistory: z.array(z.any()),
  // Pass through dashboard context
  dashboardFiles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        versionNumber: z.number(),
        metricIds: z.array(z.string()),
      })
    )
    .optional(),
});

const analysisTypeRouterInstructions = `You are an analysis type router that determines whether a user's query requires:

1. **Standard Analysis**: Straightforward data queries with clear requirements like:
   - Lists of records with specific filters
   - Reports with defined criteria
   - Simple aggregations or calculations
   - Clear data extraction requests

2. **Investigation Analysis**: Complex queries requiring research or exploration like:
   - Questions needing deep data investigation
   - Queries requiring iterative discovery
   - Complex analytical problems
   - Research-oriented questions

Analyze the user's query and determine the appropriate analysis type.`;

const execution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  try {
    // Use the input data directly
    const prompt = inputData.prompt;
    const conversationHistory = inputData.conversationHistory;

    // Prepare messages for the agent
    let messages: CoreMessage[];
    if (conversationHistory && conversationHistory.length > 0) {
      // Use conversation history as context + append new user message
      messages = appendToConversation(conversationHistory as CoreMessage[], prompt);
    } else {
      // Otherwise, use just the prompt
      messages = standardizeMessages(prompt);
    }

    // Generate the analysis type decision
    const tracedAnalysisType = wrapTraced(
      async () => {
        const { object } = await generateObject({
          model: Haiku35,
          schema: analysisTypeSchema,
          messages: [
            {
              role: 'system',
              content: analysisTypeRouterInstructions,
            },
            ...messages,
          ],
          temperature: 0,
          maxTokens: 500,
        });

        return object;
      },
      {
        name: 'GenerateAnalysisType',
        spanAttributes: {
          messageCount: messages.length,
        },
      }
    );

    const analysisType = await tracedAnalysisType();

    console.info('[Analysis Type Router] Decision:', {
      choice: analysisType.choice,
      reasoning: analysisType.reasoning,
    });

    return {
      analysisType,
      conversationHistory: messages,
      dashboardFiles: inputData.dashboardFiles, // Pass through dashboard context
    };
  } catch (error) {
    console.error('[Analysis Type Router] Error:', error);
    // Default to standard analysis on error
    return {
      analysisType: {
        choice: 'standard',
        reasoning: 'Defaulting to standard analysis due to routing error',
      },
      conversationHistory: inputData.conversationHistory || [],
      dashboardFiles: inputData.dashboardFiles, // Pass through dashboard context
    };
  }
};

export const analysisTypeRouterStep = createStep({
  id: 'analysis-type-router',
  description: 'Determines whether to use standard or investigation analysis based on the query',
  inputSchema,
  outputSchema,
  execute: execution,
});
