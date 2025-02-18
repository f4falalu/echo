/**
 * Search request parameters interface
 * Defines the parameters for performing global searches across various entities.
 *
 * @param query - The search query string to filter results
 * @param num_results - Maximum number of results to return. Defaults to 15 if not specified
 * @param exclude_metrics - When true, excludes metrics from search results
 * @param exclude_collections - When true, excludes collections from search results
 * @param exclude_dashboards - When true, excludes dashboards from search results
 * @param exclude_data_sources - When true, excludes data sources from search results
 * @param exclude_datasets - When true, excludes datasets from search results
 * @param exclude_permission_groups - When true, excludes permission groups from search results
 * @param exclude_teams - When true, excludes teams from search results
 * @param exclude_terms - When true, excludes terms from search results
 */
export interface SearchParams {
  query: string;
  num_results?: null | number;
  exclude_metrics?: null | boolean;
  exclude_collections?: null | boolean;
  exclude_dashboards?: null | boolean;
  exclude_data_sources?: null | boolean;
  exclude_datasets?: null | boolean;
  exclude_permission_groups?: null | boolean;
  exclude_teams?: null | boolean;
  exclude_terms?: null | boolean;
}
