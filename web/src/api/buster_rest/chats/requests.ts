import { mainApi } from '../instances';
import { serverFetch } from '../../createServerInstance';
import type { BusterChatListItem } from '@/api/asset_interfaces';
import type { ChatListParams } from './interfaces';

const CHATS_BASE = '/chats';

// Client-side fetch version
export const getChats = async (params?: ChatListParams): Promise<BusterChatListItem[]> => {
  const { page_token = 0, page_size = 1000, admin_view = false } = params || {};
  return mainApi
    .get<BusterChatListItem[]>(`${CHATS_BASE}/list`, {
      params: { page_token, page_size, admin_view }
    })
    .then((res) => res.data);
};

// Server-side fetch version
export const getChats_server = async (params?: ChatListParams): Promise<BusterChatListItem[]> => {
  const { page_token = 0, page_size = 1000, admin_view = false } = params || {};
  return await serverFetch<BusterChatListItem[]>(`${CHATS_BASE}/list`, {
    params: { page_token, page_size, admin_view }
  });
};
