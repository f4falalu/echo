import { mainApi } from '../instances';
import { serverFetch } from '../../createServerInstance';
import type { BusterChatListItem, BusterChat } from '@/api/asset_interfaces/chat';
import type {
  DuplicateChatParams,
  GetChatParams,
  UpdateChatParams
} from '../../request_interfaces/chats';

const CHATS_BASE = '/chats';

// Client-side fetch version
export const getListChats = async (params?: {
  page_token: number;
  page_size: number;
}): Promise<BusterChatListItem[]> => {
  const { page_token = 0, page_size = 3000 } = params || {};
  return mainApi
    .get<BusterChatListItem[]>(`${CHATS_BASE}`, {
      params: { page_token, page_size }
    })
    .then((res) => res.data);
};

export const getListLogs = async (
  params?: Parameters<typeof getListChats>[0]
): Promise<BusterChatListItem[]> => {
  const { page_token = 0, page_size = 3000 } = params || {};
  return mainApi
    .get<BusterChatListItem[]>(`/logs`, {
      params: { page_token, page_size }
    })
    .then((res) => res.data);
};

// Server-side fetch version
export const getListChats_server = async (
  params?: Parameters<typeof getListChats>[0]
): Promise<BusterChatListItem[]> => {
  const { page_token = 0, page_size = 1000 } = params || {};
  return await serverFetch<BusterChatListItem[]>(`${CHATS_BASE}`, {
    params: { page_token, page_size }
  });
};

// Client-side fetch version
export const getChat = async ({ id }: GetChatParams): Promise<BusterChat> => {
  return mainApi.get<BusterChat>(`${CHATS_BASE}/${id}`).then((res) => res.data);
};

// Server-side fetch version
export const getChat_server = async ({ id }: GetChatParams): Promise<BusterChat> => {
  return await serverFetch<BusterChat>(`${CHATS_BASE}/${id}`);
};

export const updateChat = async ({ id, ...data }: UpdateChatParams): Promise<BusterChat> => {
  return mainApi.put<BusterChat>(`${CHATS_BASE}/${id}`, data).then((res) => res.data);
};

export const deleteChat = async (ids: string[]): Promise<void> => {
  return mainApi.delete(`${CHATS_BASE}`, { data: { ids } }).then((res) => res.data);
};

export const duplicateChat = async ({
  id,
  message_id,
  share_with_same_people
}: DuplicateChatParams): Promise<BusterChat> => {
  return mainApi
    .post(`${CHATS_BASE}/duplicate`, { id, message_id, share_with_same_people })
    .then((res) => res.data);
};
