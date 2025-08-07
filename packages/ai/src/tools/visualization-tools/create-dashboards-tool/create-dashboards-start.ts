import type { CreateDashboardsAgentContext, CreateDashboardsInput } from './create-dashboards-tool';

export function createCreateDashboardsStart<
  TAgentContext extends CreateDashboardsAgentContext = CreateDashboardsAgentContext,
>(context: TAgentContext) {
  return async (_input: CreateDashboardsInput) => {
    const fileCount = _input.files?.length || 0;
    const messageId = context?.messageId;

    console.info('[create-dashboards] Starting dashboard creation', {
      fileCount,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
