import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export const createReasoningRoute = ({
  assetId: messageId,
  chatId
}: {
  assetId: string;
  chatId: string | undefined;
}) => {
  if (!chatId) {
    return '';
  }

  return createBusterRoute({
    route: BusterRoutes.APP_CHAT_ID_REASONING_ID,
    chatId,
    messageId
  });
};
