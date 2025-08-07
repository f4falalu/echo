import type { ModifyMetricsAgentContext, ModifyMetricsInput } from './modify-metrics-tool';

export function createModifyMetricsFinish<
  TAgentContext extends ModifyMetricsAgentContext = ModifyMetricsAgentContext,
>(context: TAgentContext) {
  return async (input: ModifyMetricsInput) => {
    const fileCount = input.files?.length || 0;
    const messageId = context?.messageId;
    const fileIds = input.files?.map((f) => f.id) || [];

    console.info('[modify-metrics] Input fully available', {
      fileCount,
      fileIds,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
