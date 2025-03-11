import type { SearchParams } from '@/api/request_interfaces/search';

export const allBusterSearchRequestKeys = [
  // 'query',
  // 'num_results',
  'exclude_metrics',
  'exclude_collections',
  'exclude_dashboards',
  'exclude_data_sources',
  'exclude_datasets',
  'exclude_permission_groups',
  'exclude_teams',
  'exclude_terms'
] as (keyof SearchParams)[];
