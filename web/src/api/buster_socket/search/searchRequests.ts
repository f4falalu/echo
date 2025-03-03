import type { BusterSocketRequestBase } from '../base_interfaces';
import type { SearchParams } from '../../request_interfaces/search/interfaces';

/**
 * Represents a search request in the Buster system.
 * This type defines the structure for performing global searches across various entities.
 *
 * @interface BusterSearchRequest
 * @extends {BusterSocketRequestBase<'/search', SearchParams>}
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
 *
 * @example
 * ```typescript
 * const searchRequest: BusterSearchRequest = {
 *   path: '/search',
 *   params: {
 *     query: 'dashboard metrics',
 *     num_results: 10,
 *     exclude_metrics: true
 *   }
 * };
 * ```
 */
export type BusterSearchRequest = BusterSocketRequestBase<'/search', SearchParams>;

/**
 * Type alias for BusterSearchRequest, representing the emitted search events
 */
export type BusterSearchEmits = BusterSearchRequest;
