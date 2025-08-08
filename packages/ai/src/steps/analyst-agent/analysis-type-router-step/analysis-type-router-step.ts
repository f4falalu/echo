import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { generateObject } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepWorkflowInputSchema } from '../../../schemas/workflow-schemas';
import { GPT5Nano } from '../../../utils/models/gpt-5-nano';
import { appendToConversation, standardizeMessages } from '../../../utils/standardizeMessages';
import type { AnalystRuntimeContext } from '../../../workflows/analyst-workflow';
import { formatAnalysisTypeRouterPrompt } from './format-analysis-type-router-prompt';

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

const execution = async ({
  inputData,
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

    // Format the prompt using the helper function
    const systemPrompt = formatAnalysisTypeRouterPrompt({
      userPrompt: prompt,
      ...(conversationHistory && { conversationHistory: conversationHistory as CoreMessage[] }),
    });

    // Generate the analysis type decision
    const tracedAnalysisType = wrapTraced(
      async () => {
        const { object } = await generateObject({
          model: GPT5Nano,
          schema: analysisTypeSchema,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            ...messages,
          ],
          temperature: 1,
          providerOptions: {
            openai: {
              parallelToolCalls: false,
              reasoningEffort: 'minimal',
            },
          },
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
