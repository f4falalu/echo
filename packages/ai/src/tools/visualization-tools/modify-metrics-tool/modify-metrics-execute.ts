// Temporary implementation - delegates to existing tool
import { wrapTraced } from 'braintrust';
import type {
  ModifyMetricsAgentContext,
  ModifyMetricsInput,
  ModifyMetricsOutput,
} from './modify-metrics-tool';

// For now, import and use the existing implementation
import { modifyMetrics as existingModifyMetrics } from '../modify-metrics-file-tool';

export function createModifyMetricsExecute<
  TAgentContext extends ModifyMetricsAgentContext = ModifyMetricsAgentContext,
>(context: TAgentContext) {
  return wrapTraced(
    async (input: ModifyMetricsInput): Promise<ModifyMetricsOutput> => {
      // Delegate to existing tool with context wrapped in experimental_context
      const result = await existingModifyMetrics.execute(input, { experimental_context: context });
      return result as ModifyMetricsOutput;
    },
    { name: 'modify-metrics-execute' }
  );
}
