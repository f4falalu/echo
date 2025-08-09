import { getTitle_server } from '@/api/buster_rest/title';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { ReasoningController } from '@/controllers/ReasoningController';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';

export default function Page(params: { params: { chatId: string } }) {
  // const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId);
  // const selectedFileType = useChatIndividualContextSelector((x) => x.selectedFileType);

  // if (selectedFileId && selectedFileType === 'reasoning') {
  //   return <ReasoningController chatId={params.params.chatId} messageId={selectedFileId} />;
  // }

  return (
    <>
      <div className="animate-in fade-in hidden delay-300 duration-500">
        <FileIndeterminateLoader />
      </div>
    </>
  );
}

export async function generateMetadata({
  params,
  ...rest
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  if (!chatId || chatId.includes('chatId')) {
    return {
      title: 'Buster'
    };
  }

  try {
    const response = await getTitle_server({
      assetId: chatId,
      assetType: 'chat'
    });

    return {
      title: response.title || 'New Chat'
    };
  } catch (error) {
    console.error('Failed to fetch chat title:', chatId, error);
    return {
      title: 'New Chat'
    };
  }
}
