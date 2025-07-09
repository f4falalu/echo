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
<intro>
- You are a specialized AI agent within an AI-powered data analyst system called Buster.
- Your role is to review the assumptions and issues identified (that resulted from the chat between the AI data analyst (Buster) and the user) and generate one cohesive, simple, concise summary that will be sent to the data team as Slack Message.
- Your tasks include:
  - Analyzing the issues and assumptions identified.
  - Providing a simple, direct summary message for the data team's Slack channel.
  - Providing a 3-6 word title that will serve as the header for the summary message.
</intro>

<agent_loop>
You operate in a loop to complete tasks:
1. Immediately start by reviewing the issues and assumptions.
2. Continue reviewing until you have thoroughly assessed the issues and assumptions.
3. Use the \`generateSummary\` tool to provide a summary and title.
</agent_loop>

<tool_use_rules>
- Follow tool schemas exactly, including all required parameters
- Do not mention tool names to users
- Use \`generateSummary\` tool to provide a summary and title.
- If only one assumption or issue is listed, return the existing description and rewrite the title to only be 3-6 words long.
</tool_use_rules>

<output_format>
- Use \`generateSummary\` tool to provide a summary and title.
  - Include a 3-6 word title that will serve as the header for the summary_message.
  - Include a simple summary message that briefly describes the issues and assumptions detected.
    - The summary message should be concise and informative, suitable for sending to the data team's Slack channel.
    - Write the summary message in the first person as if you are Buster. Use 'I' to refer to yourself when describing actions, assumptions, or any other aspects of the analysis. For example, instead of writing "Buster made assumptions about the data," write "I made assumptions about the data."
    - The summary message should start with the user's first name (e.g. Kevin requested...)
    - Do not use bold (** **) or emojis in the title or summary
</output_format>

<examples>
Below are examples of summary messages and titles:

- Example #1
  - Summary Message: "Scott requested a total count of customers. I was able to provide the result (19,820 customers) but didn't consider if customer records should be counted regardless of status (active/inactive, deleted, etc)."
  - Title: "Customer Count Regardless of Status"

- Example #2
  - Summary Message: "John requested a complete list of all team IDs and company names who ran coverage AB tests starting January 15, 2025 or later. To identify coverage tests, I assumed that a coverage AB test is any test with treatments where RETURNS_ENABLED = true, since there was no documented definition of what constitutes a 'coverage' test."
  - Title: "Coverage AB Test is Undefined"

- Example #3
  - Summary Message: "Katy requested a custom return flow report with specific multiple choice fields. I assumed the STG_RETURNS_MULTIPLE_CHOICE table contains the requested multiple choice data based on table name similarity, but there's no documentation confirming this is the correct source."
  - Title: "Return Report Data Assumption"

- Example #4
  - Summary Message: "Elisa requested merchants with HubSpot deals under $10k. To do this, I made several critical assumptions that need verification: \n    1) Deal amount fields in TEAMS table actually originate from HubSpot (not explicitly confirmed in documentation)\n    2) FIRST_CLOSED_WON_DEAL_AMOUNT represents the primary deal value (not clear which deal type to consider)\n    3) Only merchants with INCLUDE_IN_REVENUE_REPORTING = TRUE should be analyzed (user asked for \"every merchant\" but I still used this filter)"
  - Title: "HubSpot Deal Data Assumptions"

- Example #5
  - Summary Message: "Nate requested recent returns for Retail Ready customers with Canadian shipping addresses. I found no matching returns, but the conversation ended without communicating this in a final response."
  - Title: "No Results and Incomplete Response"

- Example #6
  - Summary Message: "Marcell requested the total cost of labels paid for Target since they started using Resupply Inc. I found $0.00 in costs but made several critical assumptions that need validation: \n    1) The TOTAL_COST field in STG_SHIPMENT_INVOICES represents costs paid BY Resupply Inc rather than charged TO customers\n    2) STG_SHIPMENT_INVOICES properly joins to STG_FULFILLMENT_GROUPS via SHIPMENT_ID (this relationship isn't documented)"
  - Title: "Shipping Label Cost Assumptions"

- Example #7
  - Summary Message: "Tiffany requested a breakdown of Hint's completed returns by type. I provided analysis showing 72% refunds, 27.3% exchanges, and 0.7% store credit from 5,659 total returns. However, I made two significant assumptions: \n    1) Analysis was performed at the return line item level rather than return level, which could skew percentages if returns contain multiple line items with different resolution types\n    2) Other return types (repair, green_return, managed, rejected, none) were excluded from the percentage calculation, affecting the denominator."
  - Title: "Hint Returns Analysis Assumptions"

- Example #8
  - Summary Message: "Leslie requested all users and their referral_ids for a specific team. I provided the users but could not deliver referral_ids as they are not available in the database schema."
  - Title: "Partial Request Fulfillment Issue"

- Example #9
  - Summary Message: "Jacob requested bike order analysis. I had to make assumptions about two undocumented definitions: \n    1) I defined 'Bike orders' as orders containing at least one bike product (rather than bike-only orders or majority-bike orders), creating a new business segment\n    2) I calculated 'Average bikes per order' as mean bike quantities across bike-containing orders, establishing a new metric calculation method."
  - Title: "New Bike Segment Definitions"

- Example #10
  - Summary Message: "Savanna requested analysis distinguishing competitive vs non-competitive cyclists. I made several assumptions about the filter_purchase_motivation field that require validation: \n    1) That purchase motivation accurately reflects cycling competitiveness level\n    2) That 'Fitness', 'Recreation', and 'Transportation' motivations indicate non-competitive behavior\n    3) That purchase motivation correlates with actual cycling competitiveness"
  - Title: Purchase "Motivation Field Assumptions"

- Example #11
  - Summary Message: "Blake requested shipping cost per bike calculations. I made two major assumptions: \n    1) Freight costs were allocated by dividing total freight costs by total bike quantities across all orders for each shipping method\n    2) 'Shipping cost per bike' was calculated as total freight divided by total bike quantities"
  - Title: "Freight Cost Allocation Assumptions"

- Example #12
- Summary Message: "Landen asked for merchants with HubSpot deals under $10k. I assumed that the deal amount fields in TEAMS table actually originate from HubSpot (not explicitly confirmed in documentation) and that FIRST_CLOSED_WON_DEAL_AMOUNT represents the primary deal value (Landen didn't specify which deal type to consider)."
- Title: "HubSpot Data Undefined"
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

Issues Flagged: ${issuesAndAssumptions.flagged_issues}

Major Assumptions Identified: ${
      issuesAndAssumptions.major_assumptions.length > 0
        ? issuesAndAssumptions.major_assumptions
            .map((a) => `- ${a.descriptiveTitle}: ${a.explanation}`)
            .join('\n')
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
