import { Agent, createStep } from '@mastra/core';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { flagChat } from '../../tools/post-processing/flag-chat';
import { noIssuesFound } from '../../tools/post-processing/no-issues-found';
import { MessageHistorySchema } from '../../utils/memory/types';
import { Sonnet4 } from '../../utils/models/sonnet-4';
import { standardizeMessages } from '../../utils/standardizeMessages';

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

export const flagChatOutputSchema = z.object({
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
  flagChatMessage: z
    .string()
    .optional()
    .describe('Confirmation message indicating no issues found'),
  flagChatTitle: z.string().optional().describe('Title for the flag chat message'),
});

// Template function that accepts datasets parameter
const CREATE_FLAG_CHAT_SYSTEM_PROMPT = `
<intro>
- You are a specialized AI agent within the Buster system, an AI-powered data analyst platform.
- Your role is to review the chat history between Buster and the user, identify signs of user frustration or issues, and flag chats for review by the data team.
- The user only sees the final response and delivered assets (e.g., charts, dashboards), not intermediate steps or errors.
- Your tasks include:
    - Analyzing the chat history for signals of potential user frustration or issues.
    - Flagging chats that meet the criteria for review.
    - Providing a simple summary message for the data team's Slack channel when a chat is flagged.
</intro>

<event_stream>
You will receive a chronological event stream containing:
1. User messages: Current and past requests.
2. Tool actions: Results from tool executions.
3. sequentialThinking thoughts: Buster's reasoning, thoughts, and decisions.
4. Other miscellaneous system events.
</event_stream>

<agent_loop>
You operate in a loop:
1. Start by reviewing the chat history for signals of user frustration or issues.
2. Continue reviewing until you have thoroughly assessed the chat.
3. If signals are detected, use the \`flagChat\` tool to flag the chat and provide a summary message.
4. If no signals are detected, use the \`noIssuesFound\` tool.
</agent_loop>

<tool_use_rules>
- Follow tool schemas exactly, including all required parameters.
- Use the \`flagChat\` tool when signals are detected, providing a title and summary message.
- Use the \`noIssuesFound\` tool if no issues are detected.
</tool_use_rules>

<signals_to_detect>
Look for these signals indicating user frustration or issues:
1. No final answer or results provided to the user.
2. Results returned were empty, zero, or null.
3. Errors prevented Buster from fulfilling the request.
4. Final response did not fully address the request or seemed forced.
5. Uncertainty or confusion in Buster's internal thoughts.
6. Final response indicates incomplete fulfillment of the request.
7. Signs of incomplete work or unresolved issues in the final response or assets.
8. Major assumptions in the final response or assets that could lead to significantly wrong results.
</signals_to_detect>

<identification_guidelines>
- Review user messages to understand requests and expectations.
- Check if Buster provided a final answer or results.
- Examine results for emptiness, zero, or null values.
- Assess if the final response fully addresses the request, noting any significant assumptions.
- Analyze Buster's thoughts for uncertainty or confusion.
- Check for unresolved issues or incomplete tasks.
- Identify major assumptions that could significantly impact results, such as:
    - Introducing undefined concepts, metrics, segments, or filters.
    - Choosing between similar fields or methods without clear guidance.
    - Making decisions based on incomplete documentation.
    - Assumptions where errors could substantially alter outcomes.
- Consider errors only if they affect the final response or assets.
</identification_guidelines>

<flagging_criteria>
Flag the chat if any of these conditions are met:
- No final answer or results provided.
- Results were empty, zero, or null (even if explained).
- Errors prevented fulfilling the request.
- Final response did not fully address the request or seemed forced.
- Significant uncertainty or confusion in Buster's thoughts.
- Final response indicated incomplete fulfillment.
- Signs of incomplete work.
- Major assumptions could lead to significantly wrong results.
</flagging_criteria>

<output_format>
- If flagging the chat, use the \`flagChat\` tool to provide a summary and title.
    - Include a 3-6 word title for the summary message.
    - Write a simple summary message:
    - Start with the user's first name and a brief, accurate description of their request (e.g., "Kevin requested a "total count of customers"").
    - Follow with a list of bullet points (each starting with "•") describing each issue and its implication.
    - Use two new lines between the intro sentence and the first bullet point, and one new line between bullet points.
    - Write in the first person as Buster, using 'I' to refer to yourself.
    - Use backticks for specific fields or calculations (e.g., \`sales.revenue\` or \`(# of orders delivered on or before due date) / (Total number of orders) * 100\`).
    - Do not use bold, headers, or emojis in the title or summary.
    - The title and summary should be written using a JSON string format.
- Example of \`flagChat\` fields:
    - Summary Message: "Nate requested \"recent returns for Retail Ready customers with Canadian shipping addresses\".\n\n- Found no matching records.\n- The conversation history doesn't show a final response was sent. Likely encountered an error."
    - Title: "No Final Response Sent"
- If no issues, use the \`noIssuesFound\` tool.
</output_format>
`;

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
      thinking: { type: 'enabled', budgetTokens: 5000 },
    },
  },
};

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral' } },
};

export const flagChatStepExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof flagChatOutputSchema>> => {
  try {
    // Use the conversation history directly since this is post-processing
    const conversationHistory = inputData.conversationHistory;

    // Create agent with injected instructions
    const flagChatAgentWithContext = new Agent({
      name: 'Flag Chat Review',
      instructions: '', // We control the system messages below at stream instantiation
      model: Sonnet4,
      tools: {
        flagChat,
        noIssuesFound,
      },
      defaultGenerateOptions: DEFAULT_OPTIONS,
      defaultStreamOptions: DEFAULT_OPTIONS,
    });

    // Prepare messages for the agent - format conversation history as text for analysis
    let messages: CoreMessage[];
    if (conversationHistory && conversationHistory.length > 0) {
      // Format conversation history as text for analysis
      const chatHistoryText = JSON.stringify(conversationHistory, null, 2);

      // Create separate system message for chat history and user message for analysis prompt
      messages = [
        {
          role: 'system',
          content: createDatasetSystemMessage(
            inputData.datasets || 'No dataset context available.'
          ),
          providerOptions: DEFAULT_CACHE_OPTIONS,
        },
        {
          role: 'system',
          content: CREATE_FLAG_CHAT_SYSTEM_PROMPT,
          providerOptions: DEFAULT_CACHE_OPTIONS,
        },
        {
          role: 'system',
          content: `Here is the chat history to analyze:

User: ${inputData.userName}

Chat History:
\`\`\`
${chatHistoryText}
\`\`\``,
          providerOptions: DEFAULT_CACHE_OPTIONS,
        },
        {
          role: 'user',
          content:
            'Please analyze this conversation history for potential user frustration or issues that should be flagged for review.',
        },
      ];
    } else {
      // If no conversation history, create a message indicating that
      messages = standardizeMessages(`User: ${inputData.userName}

No conversation history available for analysis.`);
    }

    const tracedFlagChat = wrapTraced(
      async () => {
        const response = await flagChatAgentWithContext.generate(messages);
        return response;
      },
      {
        name: 'Flag Chat Review',
      }
    );

    const flagChatResult = await tracedFlagChat();

    // Extract tool call information
    const toolCalls = flagChatResult.toolCalls || [];
    if (toolCalls.length === 0) {
      throw new Error('No tool was called by the flag chat agent');
    }

    const toolCall = toolCalls[0]; // Should only be one with maxSteps: 1
    if (!toolCall) {
      throw new Error('Tool call is undefined');
    }

    if (!toolCall) {
      throw new Error('No tool was called by the flag chat agent');
    }

    // Handle different tool responses
    let flagChatMessage: string | undefined;
    let flagChatTitle: string | undefined;

    if (toolCall.toolName === 'noIssuesFound') {
      flagChatMessage = toolCall.args.message;
      flagChatTitle = 'No Issues Found';
    } else if (toolCall.toolName === 'flagChat') {
      flagChatMessage = toolCall.args.summary_message;
      flagChatTitle = toolCall.args.summary_title;
    }

    return {
      // Pass through all input fields
      ...inputData,
      // Add new fields from this step
      toolCalled: toolCall.toolName,
      flagChatMessage,
      flagChatTitle,
    };
  } catch (error) {
    console.error('Failed to analyze chat for flagging:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error('Unable to analyze the chat for review. Please try again later.');
  }
};

export const flagChatStep = createStep({
  id: 'flag-chat',
  description:
    'This step analyzes the chat history to identify potential user frustration or issues and flags the chat for review if needed.',
  inputSchema,
  outputSchema: flagChatOutputSchema,
  execute: flagChatStepExecution,
});
