import type { ModifyDashboardsAgentContext, ModifyDashboardsInput } from './modify-dashboards-tool';

export function createModifyDashboardsFinish<
  TAgentContext extends ModifyDashboardsAgentContext = ModifyDashboardsAgentContext,
>(context: TAgentContext) {
  return async (input: ModifyDashboardsInput) => {
    const fileCount = input.files?.length || 0;
    const messageId = context?.messageId;
    const fileIds = input.files?.map((f) => f.id) || [];

    console.info('[modify-dashboards] Input fully available', {
      fileCount,
      fileIds,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
