import { z } from 'zod';
import { MessageHistorySchema } from '../../../utils/memory/types';

const inputSchema = z.object({
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('Name for the post-processing operation'),
  messageId: z.string().describe('Message ID for the current operation'),
  userId: z.string().describe('User ID for the current operation'),
  chatId: z.string().describe('Chat ID for the current operation'),
  isFollowUp: z.boolean().describe('Whether this is a follow-up message'),
  isSlackFollowUp: z
    .boolean()
    .describe('Whether this is a follow-up message for an existing Slack thread'),
  previousMessages: z.array(z.string()).describe('Array of previous messages for context'),
  datasets: z.string().describe('Assembled YAML content of all available datasets for context'),
});

export const identifyAssumptionsOutputSchema = z.object({
  // Pass through all input fields
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('Name for the post-processing operation'),
  messageId: z.string().describe('Message ID for the current operation'),
  userId: z.string().describe('User ID for the current operation'),
  chatId: z.string().describe('Chat ID for the current operation'),
  isFollowUp: z.boolean().describe('Whether this is a follow-up message'),
  isSlackFollowUp: z
    .boolean()
    .describe('Whether this is a follow-up message for an existing Slack thread'),
  previousMessages: z.array(z.string()).describe('Array of previous messages for context'),
  datasets: z.string().describe('Assembled YAML content of all available datasets for context'),

  // New fields from this step
  toolCalled: z.string().describe('Name of the tool that was called by the agent'),
  assumptions: z
    .array(
      z.object({
        descriptiveTitle: z.string().describe('A clear, descriptive title for the assumption'),
        classification: z
          .enum([
            'fieldMapping',
            'tableRelationship',
            'dataQuality',
            'dataFormat',
            'dataAvailability',
            'timePeriodInterpretation',
            'timePeriodGranularity',
            'metricInterpretation',
            'segmentInterpretation',
            'quantityInterpretation',
            'requestScope',
            'metricDefinition',
            'segmentDefinition',
            'businessLogic',
            'policyInterpretation',
            'optimization',
            'aggregation',
            'filtering',
            'sorting',
            'grouping',
            'calculationMethod',
            'dataRelevance',
            'valueScale',
            'joinSelection',
            'metricAmbiguity',
            'dataStaticAssumption',
            'uniqueIdentifier',
          ])
          .describe('The type/category of assumption made'),
        explanation: z
          .string()
          .describe('Detailed explanation of the assumption and its potential impact'),
        label: z
          .enum(['timeRelated', 'vagueRequest', 'major', 'minor'])
          .describe('Label indicating the nature and severity of the assumption'),
      })
    )
    .optional()
    .describe('List of assumptions identified'),
});

// The system prompt has been extracted to get-identify-assumptions-system-message.ts
// This removed the long 375+ line prompt from this file

const createDatasetSystemMessage = (datasets: string): string => {
  return `<dataset_context>
${datasets}
</dataset_context>`;
};

const DEFAULT_OPTIONS = {
  maxSteps: 1,
  temperature: 0,
  maxTokens: 10000,
  providerOptions: {
    anthropic: {
      disableParallelToolCalls: true,
      thinking: { type: 'enabled', budgetTokens: 16000 },
    },
  },
};

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral' } },
};

/**
 * Legacy execution function for backwards compatibility
 */
export const identifyAssumptionsStepExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof identifyAssumptionsResultSchema>> => {
  try {
    // Convert legacy input format to new simplified format
    const params: IdentifyAssumptionsStepParams = {
      conversationHistory: inputData.conversationHistory,
      userName: inputData.userName,
      datasets: inputData.datasets,
    };

    // Run the new implementation
    const result = await runIdentifyAssumptionsStep(params);

    // Convert result to legacy format with camelCase field names
    const assumptions = result.assumptions?.map((assumption) => ({
      descriptiveTitle: assumption.descriptive_title,
      classification: assumption.classification,
      explanation: assumption.explanation,
      label: assumption.label,
    }));

    // Return in legacy format with all passthrough fields
    return {
      ...inputData,
      toolCalled: result.toolCalled,
      assumptions,
    };
  } catch (error) {
    console.error('Failed to identify assumptions:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error('Unable to analyze SQL queries for assumptions. Please try again later.');
  }
};

/**
 * Export the step without using Mastra's createStep
 */
export const identifyAssumptionsStep = {
  id: 'identify-assumptions',
  description:
    'This step analyzes SQL queries to identify assumptions made during query construction that could impact result accuracy.',
  inputSchema: identifyAssumptionsStepInputSchema,
  outputSchema: identifyAssumptionsResultSchema,
  execute: runIdentifyAssumptionsStep,
};

