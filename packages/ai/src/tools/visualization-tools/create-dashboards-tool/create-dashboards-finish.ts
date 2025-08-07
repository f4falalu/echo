import type { CreateDashboardsAgentContext, CreateDashboardsInput } from './create-dashboards-tool';

export function createCreateDashboardsFinish<
  TAgentContext extends CreateDashboardsAgentContext = CreateDashboardsAgentContext,
>(context: TAgentContext) {
  return async (input: CreateDashboardsInput) => {
    const fileCount = input.files?.length || 0;
    const messageId = context?.messageId;
    const fileNames = input.files?.map((f) => f.name) || [];

    console.info('[create-dashboards] Input fully available', {
      fileCount,
      fileNames,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
