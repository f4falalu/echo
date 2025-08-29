import { useParams } from '@tanstack/react-router';

const stableSelect = (v?: { chatId?: string }) => v?.chatId !== undefined;
export const useIsChatMode = () => {
  const chatId = useParams({
    select: stableSelect,
    strict: false,
  });

  return chatId !== undefined && chatId;
};

export const useIsFileMode = () => {
  const chatId = useParams({
    select: stableSelect,
    strict: false,
  });
  return chatId === undefined;
};
