import type { ModifyMetricsAgentContext, ModifyMetricsInput } from './modify-metrics-tool';

export function createModifyMetricsDelta<
  TAgentContext extends ModifyMetricsAgentContext = ModifyMetricsAgentContext,
>(context: TAgentContext) {
  return async (_delta: Partial<ModifyMetricsInput>) => {
    const messageId = context?.messageId;

    console.info('[modify-metrics] Input delta received', {
      hasFiles: !!_delta.files,
      fileCount: _delta.files?.length,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
