import { ShareRole } from '@/api/asset_interfaces';
import type { BusterCollection, BusterCollectionListItem } from '@/api/asset_interfaces/collection';
import {
  ShareDeleteRequest,
  SharePostRequest,
  ShareUpdateRequest
} from '@/api/asset_interfaces/shared_interfaces';
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
  return await mainApi
    .get<BusterCollection>(`/collections/${params.id}`, { params })
    .then((res) => res.data);
};

export const collectionsCreateCollection = async (params: CreateCollectionParams) => {
  return await mainApi.post<BusterCollection>('/collections', params).then((res) => res.data);
};

export const collectionsUpdateCollection = async (params: UpdateCollectionParams) => {
  return await mainApi
    .put<BusterCollection>(`/collections/${params.id}`, params)
    .then((res) => res.data);
};

export const collectionsDeleteCollection = async (params: DeleteCollectionParams) => {
  return await mainApi.delete<BusterCollection>('/collections', { params }).then((res) => res.data);
};

// share collections

export const shareCollection = async ({ id, params }: { id: string; params: SharePostRequest }) => {
  return mainApi
    .post<BusterCollection>(`/collections/${id}/sharing`, params)
    .then((res) => res.data);
};

export const unshareCollection = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApi
    .delete<BusterCollection>(`/collections/${id}/sharing`, { data })
    .then((res) => res.data);
};

export const updateCollectionShare = async ({
  data,
  id
}: {
  id: string;
  data: ShareUpdateRequest;
}) => {
  return mainApi
    .put<BusterCollection>(`/collections/${id}/sharing`, { data })
    .then((res) => res.data);
};
