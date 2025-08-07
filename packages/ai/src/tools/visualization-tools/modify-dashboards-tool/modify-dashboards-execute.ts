import { wrapTraced } from 'braintrust';
import type {
  ModifyDashboardsAgentContext,
  ModifyDashboardsInput,
  ModifyDashboardsOutput,
} from './modify-dashboards-tool';

// For now, import and use the existing implementation
import { modifyDashboards as existingModifyDashboards } from '../modify-dashboards-file-tool';

export function createModifyDashboardsExecute<
  TAgentContext extends ModifyDashboardsAgentContext = ModifyDashboardsAgentContext,
>(context: TAgentContext) {
  return wrapTraced(
    async (input: ModifyDashboardsInput): Promise<ModifyDashboardsOutput> => {
      // Delegate to existing tool with context wrapped in experimental_context
      const result = await existingModifyDashboards.execute(input, {
        experimental_context: context,
      });
      return result as ModifyDashboardsOutput;
    },
    { name: 'modify-dashboards-execute' }
  );
}
