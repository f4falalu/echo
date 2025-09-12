import type { PermissionedDataset } from '@buster/access-controls';
import type { PostProcessingWorkflowInput } from '@buster/ai/workflows/message-post-processing-workflow/message-post-processing-workflow';
import type { UserPersonalizationConfigType } from '@buster/database';
import type { CoreMessage } from 'ai';
import type { PostProcessingResult } from '../types';

/**
 * Build complete workflow input from collected data
 */
export function buildWorkflowInput(
  conversationHistory: CoreMessage[],
  previousPostProcessingResults: PostProcessingResult[],
  datasets: PermissionedDataset[],
  dataSourceSyntax: string,
  userName: string,
  slackMessageExists: boolean,
  userPersonalizationConfig: UserPersonalizationConfigType | null,
  analystInstructions: string | null,
  organizationDocs: Array<{
    id: string;
    name: string;
    content: string;
    type: string;
    updatedAt: string;
  }>
): PostProcessingWorkflowInput {
  // Determine if this is a follow-up
  const isFollowUp = previousPostProcessingResults.length > 0;

  // Determine if this is a Slack follow-up (both follow-up AND Slack message exists)
  const isSlackFollowUp = isFollowUp && slackMessageExists;

  return {
    conversationHistory,
    userName,
    isFollowUp,
    isSlackFollowUp,
    datasets,
    dataSourceSyntax,
    userPersonalizationConfig: userPersonalizationConfig || undefined,
    analystInstructions: analystInstructions || undefined,
    organizationDocs: organizationDocs.length > 0 ? organizationDocs : undefined,
  };
}
