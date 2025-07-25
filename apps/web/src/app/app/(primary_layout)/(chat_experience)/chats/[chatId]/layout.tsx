import { getTitle_server } from '@/api/buster_rest/title';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export async function generateMetadata({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;

  try {
    const response = await getTitle_server({
      assetId: chatId,
      assetType: 'chat'
    });

    return {
      title: response.title || 'New Chat'
    };
  } catch (error) {
    console.error('Failed to fetch chat title:', error);
    return {
      title: 'New Chat'
    };
  }
}
