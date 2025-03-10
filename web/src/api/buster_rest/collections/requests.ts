import type { BusterCollection, BusterCollectionListItem } from '@/api/asset_interfaces/collection';
import mainApi from '@/api/buster_rest/instances';
import type {
  CreateCollectionParams,
  DeleteCollectionParams,
  GetCollectionListParams,
  GetCollectionParams,
  UpdateCollectionParams
} from '@/api/request_interfaces/collections';

export const collectionsGetList = async (params: GetCollectionListParams) => {
  return await mainApi
    .get<BusterCollectionListItem[]>('/collections', { params })
    .then((res) => res.data);
};

export const collectionsGetCollection = async (params: GetCollectionParams) => {
  return await mainApi.get<BusterCollection>('/collections', { params }).then((res) => res.data);
};

export const collectionsCreateCollection = async (params: CreateCollectionParams) => {
  return await mainApi.post<BusterCollection>('/collections', { params }).then((res) => res.data);
};

export const collectionsUpdateCollection = async (params: UpdateCollectionParams) => {
  return await mainApi.put<BusterCollection>('/collections', { params }).then((res) => res.data);
};

export const collectionsDeleteCollection = async (params: DeleteCollectionParams) => {
  return await mainApi.delete<BusterCollection>('/collections', { params }).then((res) => res.data);
};
