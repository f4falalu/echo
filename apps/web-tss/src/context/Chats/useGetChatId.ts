import { useParams } from '@tanstack/react-router';

const stableSelect = (v?: { chatId?: string }) => v?.chatId !== undefined && v.chatId;
export const useGetChatId = () => {
  const chatId = useParams({
    select: stableSelect,
    strict: false,
  });
  return chatId;
};
