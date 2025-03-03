import { BusterSocketRequestBase } from '../base_interfaces';
import type { ShareRequest } from '../shared_interfaces';
import type {
  GetCollectionListParams,
  GetCollectionParams,
  CreateCollectionParams,
  UpdateCollectionParams,
  DeleteCollectionParams
} from '../../request_interfaces/collections/interfaces';

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
  CreateCollectionParams
>;

/**
 * WebSocket request for updating an existing collection.
 */
export type CollectionUpdateCollection = BusterSocketRequestBase<
  '/collections/update',
  UpdateCollectionParams & ShareRequest
>;

/**
 * WebSocket request for deleting one or more collections.
 */
export type CollectionDeleteCollection = BusterSocketRequestBase<
  '/collections/delete',
  DeleteCollectionParams
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
