export interface GetCollectionListParams {
  /** Current page number (1-based indexing) */
  page: number;
  /** Number of items to display per page */
  page_size: number;
  /** When true, returns only collections shared with the current user */
  shared_with_me?: boolean;
  /** When true, returns only collections owned by the current user */
  owned_by_me?: boolean;
}

export interface GetCollectionParams {
  /** Unique identifier of the collection to retrieve */
  id: string;
}
