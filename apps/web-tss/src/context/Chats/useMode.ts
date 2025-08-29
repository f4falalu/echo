import { useGetChatId } from './useGetChatId';

export const useIsChatMode = () => {
  return !!useGetChatId();
};

export const useIsFileMode = () => {
  const chatId = useGetChatId();
  return chatId === undefined;
};
