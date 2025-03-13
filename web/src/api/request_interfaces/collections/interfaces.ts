import type { ShareRequest } from '@/api/asset_interfaces/shared_interfaces';
import type { ShareAssetType } from '../../asset_interfaces';

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
  /** Password for the collection */
  password?: string;
}

export interface CreateCollectionParams {
  /** Name of the new collection */
  name: string;
  /** Description detailing the purpose or contents of the collection */
  description: string;
}

export type UpdateCollectionParams = {
  /** Unique identifier of the collection to update */
  id: string;
  /** Optional new name for the collection */
  name?: string;
  /** Optional array of assets to be associated with the collection */
  assets?: {
    /** Type of the asset being added */
    type: ShareAssetType;
    /** Unique identifier of the asset */
    id: string;
  }[];
  /** Share request parameters */
  share_with?: string[];
  share_type?: string;
} & ShareRequest;

export interface DeleteCollectionParams {
  /** Array of collection IDs to be deleted */
  ids: string[];
}
