import type {
  GetChatsListRequest,
  GetChatsListResponse,
  GetLogsListRequest,
  GetLogsListResponse,
  GetChatRequest,
  GetChatResponse,
  DeleteChatsRequest,
  UpdateChatRequest,
  UpdateChatResponse,
  UpdateChatMessageFeedbackRequest,
  UpdateChatMessageFeedbackResponse,
  DuplicateChatRequest,
  DuplicateChatResponse,
  StartChatFromAssetRequest,
  StartChatFromAssetResponse
} from '@buster/server-shared/chats';
import { serverFetch } from '../../createServerInstance';
import { mainApi } from '../instances';

const CHATS_BASE = '/chats';

// Client-side fetch version
export const getListChats = async (params?: GetChatsListRequest): Promise<GetChatsListResponse> => {
  const { page_token = 0, page_size = 3500 } = params || {};
  return mainApi
    .get<GetChatsListResponse>(`${CHATS_BASE}`, {
      params: { page_token, page_size }
    })
    .then((res) => res.data);
};

export const getListLogs = async (params?: GetLogsListRequest): Promise<GetLogsListResponse> => {
  const { page_token = 0, page_size = 3500 } = params || {};
  return mainApi
    .get<GetLogsListResponse>('/logs', {
      params: { page_token, page_size }
    })
    .then((res) => res.data);
};

// Server-side fetch version
export const getListChats_server = async (
  params?: GetChatsListRequest
): Promise<GetChatsListResponse> => {
  const { page_token = 0, page_size = 1000 } = params || {};
  return await serverFetch<GetChatsListResponse>(`${CHATS_BASE}`, {
    params: { page_token, page_size }
  });
};

// Client-side fetch version
export const getChat = async ({ id }: GetChatRequest): Promise<GetChatResponse> => {
  return mainApi.get<GetChatResponse>(`${CHATS_BASE}/${id}`).then((res) => res.data);
};

// Server-side fetch version
export const getChat_server = async ({ id }: GetChatRequest): Promise<GetChatResponse> => {
  return await serverFetch<GetChatResponse>(`${CHATS_BASE}/${id}`);
};

export const deleteChat = async (data: DeleteChatsRequest): Promise<void> => {
  const stringifiedData = JSON.stringify(data);
  return mainApi.delete(`${CHATS_BASE}`, { data: stringifiedData }).then((res) => res.data);
};

export const updateChat = async ({
  id,
  ...data
}: UpdateChatRequest): Promise<UpdateChatResponse> => {
  return mainApi.put<UpdateChatResponse>(`${CHATS_BASE}/${id}`, data).then((res) => res.data);
};

export const updateChatMessageFeedback = async ({
  message_id,
  ...params
}: UpdateChatMessageFeedbackRequest): Promise<UpdateChatMessageFeedbackResponse> => {
  return mainApi.put(`/messages/${message_id}`, params).then((res) => res.data);
};

export const duplicateChat = async ({
  id,
  message_id
}: DuplicateChatRequest): Promise<DuplicateChatResponse> => {
  return mainApi.post(`${CHATS_BASE}/duplicate`, { id, message_id }).then((res) => res.data);
};

export const startChatFromAsset = async ({
  asset_id,
  asset_type
}: StartChatFromAssetRequest): Promise<StartChatFromAssetResponse> => {
  return mainApi
    .post(`${CHATS_BASE}`, {
      asset_id,
      asset_type
    })
    .then((res) => res.data);
};
