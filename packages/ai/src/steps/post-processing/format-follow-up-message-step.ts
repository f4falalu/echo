import { Agent, createStep } from '@mastra/core';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import type { z } from 'zod';
import { generateUpdateMessage } from '../../tools/post-processing/generate-update-message';
import { MessageHistorySchema } from '../../utils/memory/types';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';
import { standardizeMessages } from '../../utils/standardizeMessages';
import { postProcessingWorkflowOutputSchema } from './schemas';

// Import the schema from combine-parallel-results step
import { combineParallelResultsOutputSchema } from './combine-parallel-results-step';

// Input schema matches the output of combine-parallel-results step
const inputSchema = combineParallelResultsOutputSchema;

// Use the unified schema from the workflow
export const formatFollowUpMessageOutputSchema = postProcessingWorkflowOutputSchema;

const followUpMessageInstructions = `
<intro>
- You are a specialized AI agent within an AI-powered data analyst system.
- Your role is to generate an update message/reply for new issues and assumptions identified from subsequent messages after an initial alert has been sent to the data team.
- You will be provided with the new issues and assumptions identified from the latest messages in the chat.
- Your task is to review these new issues and assumptions and generate a sentence or two that will be sent as a reply to the original alert thread in the data team's Slack channel.
</intro>

<agent_loop>
You operate in a loop to complete tasks:
1. Immediately start by reviewing the new issues and assumptions provided.
2. Continue reviewing until you have thoroughly assessed the new issues and assumptions.
3. Use the \`generateUpdateMessage\` tool to provide the update summary.
</agent_loop>

<tool_use_rules>
- Follow the tool schema exactly, including all required parameters.
- Do not mention tool names to users.
- Use the \`generateUpdateMessage\` tool to provide the update summary.
</tool_use_rules>

<output_format>
- Use the \`generateUpdateMessage\` to provide an \`update_message\` and \`title\`.
  - Include a 3-6 word title that will serve as the header for the \`update_message\`.
  - Include a simple message that briefly describes the issues and assumptions detected.
    - The simple message should be a concise sentence or two that summarizes the new issues or assumptions.
    - Write the message in the first person. Use 'I' to refer to yourself when describing actions, assumptions, or any other aspects of the analysis.
    - The message should start with the user's first name (e.g. Kevin sent a follow up request...)
    - The message should be conversation and suitable for sending as a reply to the original alert in the data team's Slack channel.
- Do not use bold (** **) or emojis in the title or message.
</output_format>

<output_format>
- Use the \`generateUpdateMessage\` to provide an \`update_message\` and \`title\`.
  - Include a 3-6 word title that will serve as the header for the \`update_message\`.
  - Include a simple summary message with the following structure:
    - Start with the user's first name and a brief description of what they requested, e.g., "Kevin sent a follow up request for a total count of customers."
    - Then, include a transition sentence: "To fulfill this request, I had to make the following assumptions that need review:"
    - Followed by a list of bullet points, each starting with "•", describing the new assumption or issues associated with the most recent message/request and their implication, e.g., "• I assumed the \`ORDER_ID\` field is the unique identifier for orders. If incorrect, this could lead to wrong order counts."
    - Ensure there are two new lines between the transition sentence and the first bullet point, and a single new line between each bullet point.
    - If there is only one assumption or issue, still present it as a bullet point following the same format.
    - Write the entire summary message in the first person as if you are Buster, using 'I' to refer to yourself.
  - Do not use bold (** **), headers (##) or emojis in the title or summary.
</output_format>
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
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
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
