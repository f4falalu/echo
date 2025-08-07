import type { ModifyDashboardsAgentContext, ModifyDashboardsInput } from './modify-dashboards-tool';

export function createModifyDashboardsDelta<
  TAgentContext extends ModifyDashboardsAgentContext = ModifyDashboardsAgentContext,
>(context: TAgentContext) {
  return async (_delta: Partial<ModifyDashboardsInput>) => {
    const messageId = context?.messageId;

    console.info('[modify-dashboards] Input delta received', {
      hasFiles: !!_delta.files,
      fileCount: _delta.files?.length,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
