import type { CreateMetricsAgentContext, CreateMetricsInput } from './create-metrics-tool';

// Factory function for onInputStart callback
export function createCreateMetricsStart<
  TAgentContext extends CreateMetricsAgentContext = CreateMetricsAgentContext,
>(context: TAgentContext) {
  return async (_input: CreateMetricsInput) => {
    // Log the start of metric creation
    const fileCount = _input.files?.length || 0;
    const messageId = context.messageId;

    console.info('[create-metrics] Starting metric creation', {
      fileCount,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
