import { BusterChatListItem } from '@/api/asset_interfaces';

export const createFilterRecord = ({ admin_view }: { admin_view: boolean }): string => {
  const adminViewString = admin_view ? 'admin_view' : 'non_admin_view';
  return adminViewString;
};

export const chatsArrayToRecord = (chats: BusterChatListItem[]) => {
  return chats.reduce<Record<string, BusterChatListItem>>((acc, chat) => {
    acc[chat.id] = chat;
    return acc;
  }, {});
};
