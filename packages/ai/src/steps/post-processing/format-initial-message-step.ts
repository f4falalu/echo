import { Agent, createStep } from '@mastra/core';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import type { z } from 'zod';
import { generateSummary } from '../../tools/post-processing/generate-summary';
import { MessageHistorySchema } from '../../utils/memory/types';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';
import { standardizeMessages } from '../../utils/standardizeMessages';
import { postProcessingWorkflowOutputSchema } from './schemas';

// Import the schema from combine-parallel-results step
import { combineParallelResultsOutputSchema } from './combine-parallel-results-step';

// Input schema matches the output of combine-parallel-results step
const inputSchema = combineParallelResultsOutputSchema;

// Use the unified schema from the workflow
export const formatInitialMessageOutputSchema = postProcessingWorkflowOutputSchema;

const initialMessageInstructions = `
<output_format>
- Use the \`generateSummary\` tool to provide a summary and title.
  - Include a 3-6 word title that will serve as the header for the summary_message.
  - Include a simple summary message with the following structure:
    - Start with the user's first name and a brief description of what they requested, e.g., "Kevin requested a total count of customers."
    - Then, include a transition sentence: "To fulfill this request, I had to make the following assumptions that need review:"
    - Followed by a list of bullet points, each starting with "•", describing the assumption or issue and its implication, e.g., "• I assumed the \`ORDER_ID\` field is the unique identifier for orders. If incorrect, this could lead to wrong order counts."
    - Ensure there are two new lines between the transition sentence and the first bullet point, and a single new line between each bullet point.
    - If there is only one assumption or issue, still present it as a bullet point following the same format.
    - Write the entire summary message in the first person as if you are Buster, using 'I' to refer to yourself.
  - Do not use bold (** **), headers (##) or emojis in the title or summary.
</output_format>

<examples>
Below are examples of summary messages and titles:

- Example #1
  - Summary Message: "Scott requested a total count of customers. To do this, I made the following assumptions: \n\n• I included all customer records in the total count, regardless of status (active/inactive, deleted, etc). If incorrect, this could result in an inflated customer count."
  - Title: "Didn't Use Status in Customer Count"

- Example #2
  - Summary Message: "John requested a complete list of all team IDs and company names who ran coverage AB tests starting January 15, 2025 or later. To do this, I had to make an assumption that should be reviewed: \n\n• I assumed that a coverage AB test is any test with treatments where \`RETURNS_ENABLED = true\`, since there was no documented definition of what constitutes a 'coverage' test. This assumption may not align with the actual definition used by the team."
  - Title: "Missing Coverage AB Test Definition"

- Example #3
  - Summary Message: "Elisa requested merchants with HubSpot deals under $10k. To do this, I made the following assumptions that need review: \n\n• I assumed that the deal amount fields in \`TEAMS\` table actually originate from HubSpot (not explicitly confirmed in documentation). If this is not the case, the analysis would be based on incorrect data.\n• I assumed that \`FIRST_CLOSED_WON_DEAL_AMOUNT\` represents the primary deal value (it wasn't clear which deal type to use, e.g. \`DEAL_CLOSED_WON\`). This could lead to misinterpretation of the deal values.\n• I assumed that only merchants with \`INCLUDE_IN_REVENUE_REPORTING = TRUE\` should be analyzed, even though Elisa asked for \"every merchant\". This filter might exclude relevant merchants."
  - Title: "HubSpot Data Field Assumptions"

- Example #4
  - Summary Message: "Nate requested recent returns for Retail Ready customers with Canadian shipping addresses. I tried to fulfill the request, but ran into the following issues: \n\n• I found no matching returns and intended to share this with Nate, but the conversation ended abruptly.\n• My conversation doesn't show that a final response was ever sent. I likely encountered an error and this chat should be reviewed."
  - Title: "Failed to Respond"

- Example #5
  - Summary Message: "Marcell requested the total cost of labels paid for Target since they started using Resupply Inc. To do this, I made a few assumptions that should be reviewed: \n\n• I assumed the \`TOTAL_COST\` field in \`STG_SHIPMENT_INVOICES\` represents costs paid by Resupply Inc rather than charged to customers. If this is incorrect, the cost calculation would be fundamentally wrong.\n• I assumed that \`STG_SHIPMENT_INVOICES\` properly joins to \`STG_FULFILLMENT_GROUPS\` via \`SHIPMENT_ID\` (this relationship isn’t documented). If this is an incorrect join, it could lead to mismatched or missing data."
  - Title: "Shipping Label Cost Assumptions"

- Example #6
  - Summary Message: "Tiffany requested a breakdown of Hint’s completed returns by type. To do this, I had to make the following assumptions: \n\n• I performed the analysis at the \`return line item\` level rather than \`return\` level. This could skew percentages if returns contain multiple line items with different resolution types. If incorrect, this won't reflect the true distribution of return types.\n• I excluded other return types (repair, green_return, managed, rejected, none) from the percentage calculation, affecting the denominator. Excluding these could misrepresent the proportions of return types that were included."
  - Title: "Returns Level Assumptions"

- Example #7
  - Summary Message: "Leslie requested all users and their referral_ids for the Northwest team. I tried to fulfill the request, but ran into an issue: \n\n• I provided a list of the requested users but was unable to deliver \`referral_ids\` as I was unable to identify any \`referral_ids\` in the database schema. This limitation prevents fulfilling the complete request."
  - Title: "No Referral IDs Found"

- Example #8
  - Summary Message: "Jacob requested an overview of bike orders. To do this, I had to make the following assumptions: \n\n• I defined 'Bike orders' as orders containing at least one bike product (rather than bike-only orders or majority-bike orders). This definition might not align with an internal business definition for 'Bike orders' or what the user might've expected.\n• I calculated 'Average bikes per order' as mean bike quantities across bike-containing orders. This method might differ from how 'Average bikes per order' is typically calculated internally."
  - Title: "Bike Order Definition Assumptions"

- Example #9
  - Summary Message: "Savanna requested analysis distinguishing competitive vs non-competitive cyclists. To do this, I had to make a few assumptions that should be reviewed: \n\n• I assumed that the \`filter_purchase_motivation\` field accurately reflects cycling competitiveness level. If this field is not a reliable indicator, the analysis could be misleading.\n• I assumed that \`Fitness\`, \`Recreation\`, and \`Transportation\` motivations indicate non-competitive behavior. This categorization might not capture all nuances of cyclist behavior.\n• I assumed that purchase motivation correlates with actual cycling competitiveness. There might be other factors that influence competitiveness not captured by purchase motivation."
  - Title: "Assumptions for Competitive Cyclist Classifications"

- Example #10
  - Summary Message: "Landen requested a "heat map of monthly sales by customer region".I tried to fulfill the request, but ran into the following issues: \n\n• I was unable to deliver a heat map visualization because heat maps are not currently supported. Instead, I returned a table visualization and didn't clearly communicated why in my final response.\n• I assumed sales should be calculated as \`SUM(subtotal + taxamt + freight)\` from the \`sales_order_header\`. This method might differ from how sales is typically calculated internally or what Landen might've expected."
  - Title: Unsupported Chart and Undefined Sales Definition
</examples>
`;

const DEFAULT_OPTIONS = {
  maxSteps: 1,
  temperature: 0,
  maxTokens: 10000,
  providerOptions: {
    anthropic: {
      disableParallelToolCalls: true,
    },
  },
};

export const initialMessageAgent = new Agent({
  name: 'Format Initial Message',
  instructions: initialMessageInstructions,
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
  tools: {
    generateSummary,
  },
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});

export const formatInitialMessageStepExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof formatInitialMessageOutputSchema>> => {
  try {
    // Check if there are any major assumptions
    const majorAssumptions = inputData.assumptions?.filter((a) => a.label === 'major') || [];

    // If no major assumptions, return null for formatted_message
    if (majorAssumptions.length === 0) {
      return {
        ...inputData,
      };
    }

    // Prepare context about issues and assumptions for the agent
    const issuesAndAssumptions = {
      flagged_issues: inputData.flagChatMessage || 'No issues flagged',
      major_assumptions: majorAssumptions,
    };

    const contextMessage = `Issues and assumptions identified from the chat that require data team attention:

User: ${inputData.userName}

Issues Flagged: 
${issuesAndAssumptions.flagged_issues}

Major Assumptions Identified:
${
  issuesAndAssumptions.major_assumptions.length > 0
    ? issuesAndAssumptions.major_assumptions
        .map((a) => `- ${a.descriptiveTitle}: ${a.explanation}`)
        .join('\n\n')
    : 'No major assumptions identified'
}

Generate a cohesive summary with title for the data team.`;

    const messages: CoreMessage[] = standardizeMessages(contextMessage);

    const tracedInitialMessage = wrapTraced(
      async () => {
        const response = await initialMessageAgent.generate(messages, {
          toolChoice: 'required',
        });
        return response;
      },
      {
        name: 'Format Initial Message',
      }
    );

    const initialResult = await tracedInitialMessage();

    // Extract tool call information
    const toolCalls = initialResult.toolCalls || [];
    if (toolCalls.length === 0) {
      throw new Error('No tool was called by the format initial message agent');
    }

    const toolCall = toolCalls[0]; // Should only be one with maxSteps: 1
    if (!toolCall) {
      throw new Error('Tool call is undefined');
    }

    if (toolCall.toolName !== 'generateSummary') {
      throw new Error(`Unexpected tool called: ${toolCall.toolName}`);
    }

    return {
      ...inputData,
      summaryMessage: toolCall.args.summary_message,
      summaryTitle: toolCall.args.title,
    };
  } catch (error) {
    console.error('Failed to format initial message:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error('Unable to format the initial message. Please try again later.');
  }
};

export const formatInitialMessageStep = createStep({
  id: 'format-initial-message',
  description:
    'This step checks for major assumptions and generates a summary message for initial messages if major assumptions are found.',
  inputSchema,
  outputSchema: formatInitialMessageOutputSchema,
  execute: formatInitialMessageStepExecution,
});
