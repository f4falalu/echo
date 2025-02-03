import type { BusterSearchResult } from '@/api/asset_interfaces';

export enum SearchResponses {
  '/search:search' = '/search:search'
}

export type SearchResponse = {
  route: '/search:search';
  callback: (d: BusterSearchResult[]) => void;
  onError?: (d: unknown) => void;
};

export type SearchResponseTypes = SearchResponse;
