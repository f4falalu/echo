import { ReasoningController } from '@appControllers/ReasoningController';

export default function Page({
  params: { chatId, messageId }
}: {
  params: { chatId: string; messageId: string };
}) {
  return (
    <>
      <ReasoningController chatId={chatId} messageId={messageId} />
    </>
  );
}
