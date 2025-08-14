import {
  type DeleteChatsRequest,
  type DuplicateChatRequest,
  type DuplicateChatResponse,
  type GetChatRequest,
  type GetChatResponse,
  type GetChatsListRequest,
  type GetChatsListResponse,
  type GetLogsListRequest,
  GetLogsListRequestSchema,
  type GetLogsListResponse,
  type UpdateChatMessageFeedbackRequest,
  type UpdateChatMessageFeedbackResponse,
  type UpdateChatRequest,
  type UpdateChatResponse,
} from '@buster/server-shared/chats';
import { createServerFn } from '@tanstack/react-start';
import { createAxiosInstance } from '../../createAxiosInstance';
import { serverFetch } from '../../createServerInstance';
import { mainApi, mainApiV2 } from '../instances';

const CHATS_BASE = '/chats';

// Client-side fetch version
export const getListChats = async (params?: GetChatsListRequest): Promise<GetChatsListResponse> => {
  const { page_token = 0, page_size = 3500 } = params || {};
  return mainApi
    .get<GetChatsListResponse>(`${CHATS_BASE}`, {
      params: { page_token, page_size },
    })
    .then((res) => res.data);
};

export const getListLogs = async (params?: GetLogsListRequest): Promise<GetLogsListResponse> => {
  const { page_token = 0, page_size = 3500 } = params || {};
  return mainApi
    .get<GetLogsListResponse>('/logs', {
      params: { page_token, page_size },
    })
    .then((res) => res.data);
};

// Client-side fetch version
export const getChat = async ({ id }: GetChatRequest): Promise<GetChatResponse> => {
  return mainApi.get<GetChatResponse>(`${CHATS_BASE}/${id}`).then((res) => res.data);
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
  message_id,
}: DuplicateChatRequest): Promise<DuplicateChatResponse> => {
  return mainApi.post(`${CHATS_BASE}/duplicate`, { id, message_id }).then((res) => res.data);
};
