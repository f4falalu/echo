import type { CreateMetricsAgentContext, CreateMetricsInput } from './create-metrics-tool';

// Factory function for onInputDelta callback
export function createCreateMetricsDelta<
  TAgentContext extends CreateMetricsAgentContext = CreateMetricsAgentContext,
>(context: TAgentContext) {
  return async (_delta: Partial<CreateMetricsInput>) => {
    // Log input delta for debugging
    const messageId = context.messageId;

    console.info('[create-metrics] Input delta received', {
      hasFiles: !!_delta.files,
      fileCount: _delta.files?.length,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
