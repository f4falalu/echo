import type { ModifyMetricsAgentContext, ModifyMetricsInput } from './modify-metrics-tool';

export function createModifyMetricsStart<
  TAgentContext extends ModifyMetricsAgentContext = ModifyMetricsAgentContext,
>(context: TAgentContext) {
  return async (_input: ModifyMetricsInput) => {
    const fileCount = _input.files?.length || 0;
    const messageId = context?.messageId;

    console.info('[modify-metrics] Starting metric modification', {
      fileCount,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
