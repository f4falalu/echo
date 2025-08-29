import { useParams } from '@tanstack/react-router';
import isEmpty from 'lodash/isEmpty';
import { useGetChatId } from './useGetChatId';

export const useIsChatMode = () => {
  return !!useGetChatId();
};

export const useIsFileMode = () => {
  const chatId = useGetChatId();
  return chatId === undefined;
};

export const useIsBothMode = () => {
  const isChatMode = useIsChatMode();
  const { chatId, ...params } = useParams({
    strict: false,
  });

  return isChatMode && !isEmpty(params);
};
