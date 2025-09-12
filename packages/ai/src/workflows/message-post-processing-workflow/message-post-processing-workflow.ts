import type { PermissionedDataset } from '@buster/access-controls';
import { UserPersonalizationConfigSchema } from '@buster/database';
import type { CoreMessage } from 'ai';
import { z } from 'zod';
import { runFlagChatStep } from '../../steps/message-post-processing-steps/flag-chat-step/flag-chat-step';
import { runFormatFollowUpMessageStep } from '../../steps/message-post-processing-steps/format-follow-up-message-step/format-follow-up-message-step';
import { runFormatInitialMessageStep } from '../../steps/message-post-processing-steps/format-initial-message-step/format-initial-message-step';
import { runIdentifyAssumptionsStep } from '../../steps/message-post-processing-steps/identify-assumptions-step/identify-assumptions-step';
import { MessageHistorySchema } from '../../utils/memory/types';

// Input schema for the workflow
export const postProcessingWorkflowInputSchema = z.object({
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('User name for context'),
  datasets: z.array(z.custom<PermissionedDataset>()).describe('Available datasets'),
  dataSourceSyntax: z.string().describe('SQL dialect for the data source'),
  isFollowUp: z.boolean().optional().describe('Whether this is a follow-up message'),
  isSlackFollowUp: z.boolean().optional().describe('Whether this is a Slack follow-up'),
  userPersonalizationConfig: UserPersonalizationConfigSchema.optional(),
  analystInstructions: z.string().optional().describe('Organization analyst instructions'),
  organizationDocs: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        content: z.string(),
        type: z.string(),
        updatedAt: z.string(),
      })
    )
    .optional()
    .describe('Organization documentation'),
});

// Output schema for the workflow
export const postProcessingWorkflowOutputSchema = z.object({
  flagChatResult: z.object({
    type: z.enum(['flagChat', 'noIssuesFound']),
    summaryMessage: z.string().optional(),
    summaryTitle: z.string().optional(),
    message: z.string().optional(),
  }),
  assumptionsResult: z.object({
    toolCalled: z.string(),
    assumptions: z
      .array(
        z.object({
          descriptiveTitle: z.string(),
          classification: z.string(),
          explanation: z.string(),
          label: z.enum(['timeRelated', 'vagueRequest', 'major', 'minor']),
        })
      )
      .optional(),
  }),
  formattedMessage: z.string().optional().describe('Formatted message based on type'),
});

// Export types from schemas
export type PostProcessingWorkflowInput = z.infer<typeof postProcessingWorkflowInputSchema>;
export type PostProcessingWorkflowOutput = z.infer<typeof postProcessingWorkflowOutputSchema>;

/**
 * Runs the message post-processing workflow
 * This workflow processes messages through multiple steps:
 * 1. Run flag chat analysis and identify assumptions in parallel
 * 2. Format the message based on whether it's a follow-up or initial message
 */
export async function runMessagePostProcessingWorkflow(
  input: PostProcessingWorkflowInput
): Promise<PostProcessingWorkflowOutput> {
  // Validate input
  const validatedInput = postProcessingWorkflowInputSchema.parse(input);

  // Step 1: Run parallel analysis steps
  const [flagChatResult, assumptionsResult] = await Promise.all([
    runFlagChatStep({
      conversationHistory: validatedInput.conversationHistory,
      userName: validatedInput.userName,
      datasets: validatedInput.datasets,
      dataSourceSyntax: validatedInput.dataSourceSyntax,
      organizationDocs: validatedInput.organizationDocs,
      analystInstructions: validatedInput.analystInstructions,
    }),
    runIdentifyAssumptionsStep({
      conversationHistory: validatedInput.conversationHistory,
      userName: validatedInput.userName,
      datasets: validatedInput.datasets,
      dataSourceSyntax: validatedInput.dataSourceSyntax,
      organizationDocs: validatedInput.organizationDocs,
      userPersonalizationConfig: validatedInput.userPersonalizationConfig,
    }),
  ]);

  // Step 2: Format message based on type and available data
  let formattedMessage: string | undefined;

  // Extract major assumptions for formatting
  const majorAssumptions =
    assumptionsResult.assumptions?.filter((assumption) => assumption.label === 'major') || [];

  // Get flagged issues summary
  const flaggedIssues =
    flagChatResult.type === 'flagChat' ? flagChatResult.summaryMessage || '' : '';

  // Only format if we have major assumptions or flagged issues
  if (majorAssumptions.length > 0 || flaggedIssues) {
    if (validatedInput.isFollowUp === true && validatedInput.isSlackFollowUp === true) {
      // Format follow-up message
      const followUpResult = await runFormatFollowUpMessageStep({
        userName: validatedInput.userName,
        flaggedIssues,
        majorAssumptions,
        conversationHistory: validatedInput.conversationHistory,
      });
      formattedMessage = followUpResult.summaryMessage;
    } else if (!validatedInput.isSlackFollowUp) {
      // Format initial message (when isSlackFollowUp is false or undefined)
      const initialResult = await runFormatInitialMessageStep({
        userName: validatedInput.userName,
        flaggedIssues,
        majorAssumptions,
        conversationHistory: validatedInput.conversationHistory,
      });
      formattedMessage = initialResult.summaryMessage;
    }
  }

  // Return combined results
  return {
    flagChatResult: {
      type: flagChatResult.type,
      summaryMessage:
        flagChatResult.type === 'flagChat' ? flagChatResult.summaryMessage : undefined,
      summaryTitle: flagChatResult.type === 'flagChat' ? flagChatResult.summaryTitle : undefined,
      message: flagChatResult.type === 'noIssuesFound' ? flagChatResult.message : undefined,
    },
    assumptionsResult,
    formattedMessage,
  };
}

export { runMessagePostProcessingWorkflow as default };
