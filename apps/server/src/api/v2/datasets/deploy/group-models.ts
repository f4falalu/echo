import type { DeployModel } from '@buster/server-shared';

/**
 * Group models by data source name
 * Pure function for organizing models
 */
export function groupModelsByDataSource(models: DeployModel[]): Map<string, DeployModel[]> {
  const modelsByDataSource = new Map<string, DeployModel[]>();

  for (const model of models) {
    const existing = modelsByDataSource.get(model.data_source_name) || [];
    existing.push(model);
    modelsByDataSource.set(model.data_source_name, existing);
  }

  return modelsByDataSource;
}
