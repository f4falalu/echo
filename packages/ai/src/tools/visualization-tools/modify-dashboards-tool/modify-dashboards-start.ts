import type { ModifyDashboardsAgentContext, ModifyDashboardsInput } from './modify-dashboards-tool';

export function createModifyDashboardsStart<
  TAgentContext extends ModifyDashboardsAgentContext = ModifyDashboardsAgentContext,
>(context: TAgentContext) {
  return async (_input: ModifyDashboardsInput) => {
    const fileCount = _input.files?.length || 0;
    const messageId = context?.messageId;

    console.info('[modify-dashboards] Starting dashboard modification', {
      fileCount,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
