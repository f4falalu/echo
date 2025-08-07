import { wrapTraced } from 'braintrust';
import type {
  CreateDashboardsAgentContext,
  CreateDashboardsInput,
  CreateDashboardsOutput,
} from './create-dashboards-tool';

// For now, import and use the existing implementation
import { createDashboards as existingCreateDashboards } from '../create-dashboards-file-tool';

export function createCreateDashboardsExecute<
  TAgentContext extends CreateDashboardsAgentContext = CreateDashboardsAgentContext,
>(context: TAgentContext) {
  return wrapTraced(
    async (input: CreateDashboardsInput): Promise<CreateDashboardsOutput> => {
      // Delegate to existing tool with context wrapped in experimental_context
      const result = await existingCreateDashboards.execute(input, {
        experimental_context: context,
      });
      return result as CreateDashboardsOutput;
    },
    { name: 'create-dashboards-execute' }
  );
}
