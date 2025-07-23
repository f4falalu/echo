import { Agent, createStep } from '@mastra/core';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import type { z } from 'zod';
import { generateUpdateMessage } from '../../tools/post-processing/generate-update-message';
import { standardizeMessages } from '../../utils/standardizeMessages';
import { postProcessingWorkflowOutputSchema } from './schemas';

import { Sonnet4 } from '../../utils/models/sonnet-4';
// Import the schema from combine-parallel-results step
import { combineParallelResultsOutputSchema } from './combine-parallel-results-step';

// Input schema matches the output of combine-parallel-results step
const inputSchema = combineParallelResultsOutputSchema;

// Use the unified schema from the workflow
export const formatFollowUpMessageOutputSchema = postProcessingWorkflowOutputSchema;

const followUpMessageInstructions = `
<intro>
- You are a specialized AI agent named Buster within an AI-powered data analyst system.
- The data team manages the system documentation and should be notified of major assumptions or issues encountered due to lack of documentation.
- The data team has already been notified of initial issues and assumptions.
- Your recent analysis was reviewed by an 'Evaluation Agent', which flagged additional assumptions made and issues encountered.
- Your job is to create an update message for the new issues and assumptions found in the most recent chat messages.
- Your role is to receive these new issues and assumptions, review them, and write a short, conversational reply for the data team's Slack thread.
- The data team will use this summary to understand the user's request, assumptions made, issues encountered, and areas needing clarification in the documentation.
- Your tasks:
  - Assess the existing alert that was sent to the data team.
  - Analyze the newly flagged assumptions and issues.
  - Provide a simple, direct summary message for the data team's Slack channel.
  - Provide a 3-6 word title for the summary message.
</intro>

<agent_loop>
Your process:
1. Start by thinking through the new issues and assumptions.
2. Continue thinking until you have thoroughly assessed them and planned your summary message and title.
3. Use the \`generateUpdateMessage\` tool to send the update.
</agent_loop>

<tool_use_rules>
- Follow the tool schema exactly, including all required parameters.
- Use the \`generateUpdateMessage\` tool to provide the update summary.
</tool_use_rules>

<output_format>
- Use the \`generateUpdateMessage\` tool to send an \`update_message\` and \`title\`.
  - Title: A 3-6 word header describing the key issues or assumptions (e.g., "No Referral IDs Found").
  - Update Message:
    - Start with the user's first name and a brief, accurate description of their follow-up request (e.g., "Kevin sent a follow up request to /"filter by the last 6 months/".").
    - Follow with a list of bullet points (each starting with "•") describing each assumption or issue and its implication.
    - Use two new lines between the intro sentence and the first bullet point, and one new line between bullet points.
    - Write in the first person as Buster, using 'I' to refer to yourself.
    - Use backticks for specific fields or calculations (e.g., \`sales.revenue\` or \`(# of orders delivered on or before due date) / (Total number of orders) * 100\`).
- Do not use bold, headers, or emojis in the title or summary.
- The title and summary should be written using a JSON string format.
</output_format>

<example>
- Summary Message: "Scott sent a followup request to change metric to show \"total count of customers\".\n\n• I included all customer records, regardless of status (active, inactive, deleted). If incorrect, this likely inflates the count."
- Title: "Customer Count Includes All Statuses"
</example>
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

export const followUpMessageAgent = new Agent({
  name: 'Format Follow-up Message',
  instructions: followUpMessageInstructions,
  model: Sonnet4,
  tools: {
    generateUpdateMessage,
  },
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});

export const formatFollowUpMessageStepExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof formatFollowUpMessageOutputSchema>> => {
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

    const contextMessage = `New issues and assumptions identified from the latest chat messages:

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

Generate a concise update message for the data team.`;

    const messages: CoreMessage[] = standardizeMessages(contextMessage);

    const tracedFollowUpMessage = wrapTraced(
      async () => {
        const response = await followUpMessageAgent.generate(messages, {
          toolChoice: 'required',
        });
        return response;
      },
      {
        name: 'Format Follow-up Message',
      }
    );

    const followUpResult = await tracedFollowUpMessage();

    // Extract tool call information
    const toolCalls = followUpResult.toolCalls || [];
    if (toolCalls.length === 0) {
      throw new Error('No tool was called by the format follow-up message agent');
    }

    const toolCall = toolCalls[0]; // Should only be one with maxSteps: 1
    if (!toolCall) {
      throw new Error('Tool call is undefined');
    }

    if (toolCall.toolName !== 'generateUpdateMessage') {
      throw new Error(`Unexpected tool called: ${toolCall.toolName}`);
    }

    const updateMessage = toolCall.args.update_message;
    const title = toolCall.args.title;

    // Return all input data plus the formatted message
    return {
      ...inputData,
      summaryMessage: updateMessage,
      summaryTitle: title,
      message: updateMessage, // Store the update message in the message field as well
    };
  } catch (error) {
    console.error('Failed to format follow-up message:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error('Unable to format the follow-up message. Please try again later.');
  }
};

export const formatFollowUpMessageStep = createStep({
  id: 'format-follow-up-message',
  description:
    'This step generates an update message for follow-up messages with new issues and assumptions identified.',
  inputSchema,
  outputSchema: formatFollowUpMessageOutputSchema,
  execute: formatFollowUpMessageStepExecution,
});
