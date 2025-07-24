import type { ChatCreateRequest, ChatWithMessages } from '@buster/server-shared/chats';
import mainApi, { mainApiV2 } from '../instances';

export const createNewChat = async (props: ChatCreateRequest) => {
  return mainApi.post<ChatWithMessages>('/chats', props).then((res) => res.data);
};

export const stopChat = async ({ chatId }: { chatId: string }) => {
  return mainApiV2.delete<unknown>(`/chats/${chatId}/cancel`).then((res) => res.data);
};

export const startChatFromAsset = async (
  params: Pick<NonNullable<ChatCreateRequest>, 'asset_id' | 'asset_type' | 'prompt'>
): Promise<ChatWithMessages> => {
  return mainApi.post<ChatWithMessages>('/chats', params).then((res) => res.data);
};
