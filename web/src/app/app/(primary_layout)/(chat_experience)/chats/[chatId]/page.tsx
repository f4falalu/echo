'use client';

import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { ReasoningController } from '@/controllers/ReasoningController';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';

export default function Page(params: { params: { chatId: string } }) {
  const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId);
  const selectedFileType = useChatIndividualContextSelector((x) => x.selectedFileType);

  if (selectedFileId && selectedFileType === 'reasoning') {
    return <ReasoningController chatId={params.params.chatId} messageId={selectedFileId} />;
  }

  return (
    <>
      <FileIndeterminateLoader />
      <div className="p-5">
        <StatusCard
          title="Error"
          message="If you are seeing this, tell Nate and screenshot this whole page including the URL and logs..."
        />
      </div>
    </>
  );
}
