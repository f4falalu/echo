import type { DeployModel } from '@buster/server-shared';
import { describe, expect, it } from 'vitest';
import { groupModelsByDataSource } from './group-models';

describe('groupModelsByDataSource', () => {
  it('should group models by data source name', () => {
    const models: DeployModel[] = [
      {
        name: 'users',
        data_source_name: 'postgres_main',
        schema: 'public',
        description: 'Users table',
        columns: [],
      },
      {
        name: 'orders',
        data_source_name: 'postgres_main',
        schema: 'public',
        description: 'Orders table',
        columns: [],
      },
      {
        name: 'products',
        data_source_name: 'postgres_secondary',
        schema: 'public',
        description: 'Products table',
        columns: [],
      },
    ];

    const grouped = groupModelsByDataSource(models);

    expect(grouped.size).toBe(2);
    expect(grouped.get('postgres_main')).toHaveLength(2);
    expect(grouped.get('postgres_secondary')).toHaveLength(1);

    const mainModels = grouped.get('postgres_main');
    expect(mainModels?.[0]?.name).toBe('users');
    expect(mainModels?.[1]?.name).toBe('orders');

    const secondaryModels = grouped.get('postgres_secondary');
    expect(secondaryModels?.[0]?.name).toBe('products');
  });

  it('should return empty map for empty array', () => {
    const models: DeployModel[] = [];
    const grouped = groupModelsByDataSource(models);

    expect(grouped.size).toBe(0);
  });

  it('should handle single model', () => {
    const models: DeployModel[] = [
      {
        name: 'users',
        data_source_name: 'postgres_main',
        schema: 'public',
        description: 'Users table',
        columns: [],
      },
    ];

    const grouped = groupModelsByDataSource(models);

    expect(grouped.size).toBe(1);
    expect(grouped.get('postgres_main')).toHaveLength(1);
  });

  it('should handle all models from same data source', () => {
    const models: DeployModel[] = [
      {
        name: 'users',
        data_source_name: 'postgres_main',
        schema: 'public',
        description: 'Users table',
        columns: [],
      },
      {
        name: 'orders',
        data_source_name: 'postgres_main',
        schema: 'public',
        description: 'Orders table',
        columns: [],
      },
      {
        name: 'products',
        data_source_name: 'postgres_main',
        schema: 'public',
        description: 'Products table',
        columns: [],
      },
    ];

    const grouped = groupModelsByDataSource(models);

    expect(grouped.size).toBe(1);
    expect(grouped.get('postgres_main')).toHaveLength(3);
  });
});
