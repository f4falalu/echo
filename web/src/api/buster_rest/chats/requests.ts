import { mainApi } from '../instances';
import { serverFetch } from '../../createServerInstance';
import type { BusterChatListItem, BusterChat } from '@/api/asset_interfaces/chat';
import type { GetChatListParams, GetChatParams } from '../../request_interfaces/chats';

const CHATS_BASE = '/chats';

// Client-side fetch version
export const getListChats = async (params?: GetChatListParams): Promise<BusterChatListItem[]> => {
  const { page_token = 0, page_size = 1000, admin_view = false } = params || {};
  return mainApi
    .get<BusterChatListItem[]>(`${CHATS_BASE}/list`, {
      params: { page_token, page_size, admin_view }
    })
    .then((res) => res.data);
};

// Server-side fetch version
export const getListChats_server = async (
  params?: GetChatListParams
): Promise<BusterChatListItem[]> => {
  const { page_token = 0, page_size = 1000, admin_view = false } = params || {};
  return await serverFetch<BusterChatListItem[]>(`${CHATS_BASE}/list`, {
    params: { page_token, page_size, admin_view }
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
