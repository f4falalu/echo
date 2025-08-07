import type { CreateMetricsAgentContext, CreateMetricsInput } from './create-metrics-tool';

// Factory function for onInputAvailable callback
export function createCreateMetricsFinish<
  TAgentContext extends CreateMetricsAgentContext = CreateMetricsAgentContext,
>(context: TAgentContext) {
  return async (input: CreateMetricsInput) => {
    // Log when input is fully available
    const fileCount = input.files?.length || 0;
    const messageId = context.messageId;
    const fileNames = input.files?.map((f) => f.name) || [];

    console.info('[create-metrics] Input fully available', {
      fileCount,
      fileNames,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
