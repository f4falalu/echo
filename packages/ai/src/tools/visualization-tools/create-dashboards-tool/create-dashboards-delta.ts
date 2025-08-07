import type { CreateDashboardsAgentContext, CreateDashboardsInput } from './create-dashboards-tool';

export function createCreateDashboardsDelta<
  TAgentContext extends CreateDashboardsAgentContext = CreateDashboardsAgentContext,
>(context: TAgentContext) {
  return async (_delta: Partial<CreateDashboardsInput>) => {
    const messageId = context?.messageId;

    console.info('[create-dashboards] Input delta received', {
      hasFiles: !!_delta.files,
      fileCount: _delta.files?.length,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
