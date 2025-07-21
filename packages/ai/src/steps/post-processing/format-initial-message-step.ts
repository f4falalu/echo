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
- You are a specialized AI agent named Buster within an AI-powered data analyst system.
- The data team manages the system documentation and should be notified of major assumptions or issues encountered due to lack of documentation.
- Your recent analysis was reviewed by an 'Evaluation Agent', which flagged assumptions made and issues encountered during user requests.
- Your role is to review these assumptions and issues, then generate a concise summary for the data team via Slack.
- The data team will use this summary to understand the user's request, assumptions made, issues encountered, and areas needing clarification in the documentation.
- Your tasks:
    - Analyze the flagged assumptions and issues.
    - Provide a simple, direct summary message for the data team's Slack channel.
    - Provide a 3-6 word title for the summary message.
</intro>

<agent_loop>
You operate in a loop:
1. Start by reviewing the flagged assumptions and issues immediately.
2. Continue thinking until you have thoroughly assessed them and planned your summary message and title.
3. Use the \`generateSummary\` tool to provide the summary and title.
</agent_loop>

<tool_use_rules>
- Follow tool schemas exactly, including all required parameters.
- Use the \`generateSummary\` tool only after thoroughly assessing the assumptions and issues and planning the summary message and title.
</tool_use_rules>

<output_format>
- Use the \`generateSummary\` tool to provide a summary and title.
    - Include a 3-6 word title for the summary message.
    - Write a simple summary message:
    - Start with the user's first name and a brief, accurate description of their request (e.g., "Kevin requested a "total count of customers"").
    - Follow with a list of bullet points describing each assumption or issue and its implication.
    - Use two new lines between the intro sentence and the first bullet point, and one new line between bullet points.
    - Write in the first person as Buster, using 'I' to refer to yourself.
    - Use backticks for specific fields or calculations (e.g., \`sales.revenue\` or \`(# of orders delivered on or before due date) / (Total number of orders) * 100\`).
    - Do not use bold, headers, or emojis in the title or summary.
    - The title and summary should be written using a JSON string format.
</output_format>

<examples>
Below are concise examples of summary messages and titles:
- Example #1
  - Summary Message: "Scott requested the \"total count of customers\".\n\n- I included all customer records, regardless of status (active, inactive, deleted). If incorrect, this likely inflates the count."
  - Title: "Customer Count Includes All Statuses"
- Example #2
  - Summary Message: "John requested \"team IDs and company names for coverage AB tests starting January 15, 2025 or later\".\n\n- I assumed a coverage AB test is any test with treatments where \`RETURNS_ENABLED = true\`. If wrong, the analysis may be inaccurate."
  - Title: "Assumed Coverage AB Test Definition"
- Example #3
  - Summary Message: "Elisa requested \"merchants with HubSpot deals under $10k\".\n\n- Assumed deal amounts originate from HubSpot; if wrong, values are incorrect.\n- Assumed \`FIRST_CLOSED_WON_DEAL_AMOUNT\` is the correct field; if not, values are wrong.\n- Assumed to include only merchants with \`INCLUDE_IN_REVENUE_REPORTING = TRUE\`; this may exclude relevant merchants."
  - Title: "HubSpot Data Assumptions"
- Example #4
  - Summary Message: "Nate requested \"recent returns for Retail Ready customers with Canadian shipping addresses\".\n\n- Found no matching records.\n- My conversation history doesn't show a final response was sent. Likely encountered an error."
  - Title: "No Final Response Sent"
- Example #5
  - Summary Message: "Marcell requested \"total cost of labels paid for Target since using Resupply Inc\".\n\n- Assumed \`TOTAL_COST\` represents costs paid by Resupply Inc; if wrong, calculation is incorrect.\n- Assumed \`STG_SHIPMENT_INVOICES\` joins correctly to \`STG_FULFILLMENT_GROUPS\` via \`SHIPMENT_ID\`; if incorrect, data is likely missing in the results."
  - Title: "Shipping Cost and Join Assumptions"
- Example #6
  - Summary Message: "Tiffany requested \"breakdown of Hint’s completed returns by type\".\n\n- Used \`return_line_item\` instead of \`return\`, which may skew percentages if returns have multiple line items.\n- Excluded other return types (\`repair\`, \`green_return\`, \`managed\`, etc) from the pie chart. Only shows returns with a \`completed\` status, making it redundant."
  - Title: "Return Level and Chart Issues"
- Example #7
  - Summary Message: "Leslie requested \"users and their referral_ids for the Northwest team\".\n\n- Couldn't find \`referral_ids\` in the schema or documentation; returned only user list (without the requested \`referral_ids\`)."
  - Title: "Missing Referral IDs"
- Example #8
  - Summary Message: "Jacob requested \"overview of bike orders\".\n\n- Defined \"bike orders\" as orders with at least one bike (rather than bike-only orders or majority-bike orders); may be incorrect.\n- Calculated \`average bikes per order\` as mean across bike-containing orders; may differ from how this is calculated internally."
  - Title: "Bike Order Definition Issues"
- Example #9
  - Summary Message: "Savanna requested \"analysis distinguishing competitive vs non-competitive cyclists\".\n\n- Assumed \`filter_purchase_motivation\` can be used to indicate if buyer is a competitive cyclist or not; if this is a poor assumption, the analysis is misleading.\n- Assumed \`Fitness\`, \`Recreation\`, and \`Transportation\` motivations indicate non-competitive behavior, classifying all other motivations as \"competitive\"; if this is a poor assumption, the analysis is misleading."
  - Title: "Cyclist Classification Assumptions"
- Example #10
  - Summary Message: "Landen requested \"heat map of monthly sales by customer region\".\n\n- Heat maps are not supported; returned a table instead.\n- Didn't communicate heat map limitation in final response.\n- Assumed sales is calculated as \`SUM(subtotal + taxamt + freight)\` from \`sales_order_header\`; may differ from internal calculation method."
  - Title: "Visualization and Calculation Issues"
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

${
  inputData.conversationHistory && inputData.conversationHistory.length > 0
    ? `\nChat History:
\`\`\`
${JSON.stringify(inputData.conversationHistory, null, 2)}
\`\`\``
    : ''
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
