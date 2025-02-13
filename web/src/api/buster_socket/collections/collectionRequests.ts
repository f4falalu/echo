import { ShareAssetType } from '../../asset_interfaces';
import { BusterSocketRequestBase } from '../base_interfaces';
import { ShareRequest } from '../shared_interfaces';
import type {
  GetCollectionListParams,
  GetCollectionParams
} from '../../request_interfaces/collections';

/**
 * WebSocket request for listing collections with pagination support.
 */
export type CollectionsListEmit = BusterSocketRequestBase<
  '/collections/list',
  GetCollectionListParams
>;

/**
 * WebSocket request for retrieving a specific collection by ID.
 */
export type CollectionGetIndividual = BusterSocketRequestBase<
  '/collections/get',
  GetCollectionParams
>;

/**
 * WebSocket request for creating a new collection.
 */
export type CollectionCreateNewCollection = BusterSocketRequestBase<
  '/collections/post',
  {
    /** Name of the new collection */
    name: string;
    /** Description detailing the purpose or contents of the collection */
    description: string;
  }
>;

/**
 * WebSocket request for updating an existing collection.
 */
export type CollectionUpdateCollection = BusterSocketRequestBase<
  '/collections/update',
  {
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
  } & ShareRequest
>;

/**
 * WebSocket request for deleting one or more collections.
 */
export type CollectionDeleteCollection = BusterSocketRequestBase<
  '/collections/delete',
  {
    /** Array of collection IDs to be deleted */
    ids: string[];
  }
>;

/**
 * Union type of all possible collection-related WebSocket requests.
 */
export type CollectionsEmit =
  | CollectionsListEmit
  | CollectionGetIndividual
  | CollectionCreateNewCollection
  | CollectionUpdateCollection
  | CollectionDeleteCollection;
