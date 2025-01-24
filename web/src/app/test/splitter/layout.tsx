'use client';

import { ChatLayout, useSelectedFileByParams } from '@chatLayout/index';
import { AppChatMessageFileType } from '@/components/messages/AppChatMessageContainer';
import { useRouter } from 'next/navigation';
import { useHotkeys } from 'react-hotkeys-hook';

export default function Layout({}: {}) {
  const { selectedFile, selectedLayout } = useSelectedFileByParams();
  const router = useRouter();

  useHotkeys('m', () => {
    const randomType: AppChatMessageFileType = (
      ['dataset', 'collection', 'metric', 'dashboard'] as AppChatMessageFileType[]
    )[Math.floor(Math.random() * 4)];
    const isPureChat = Math.random() < 0.15;
    const isChat = Math.random() < 0.55;
    const randomChatId = Math.floor(Math.random() * 1000);
    const randomId = Math.floor(Math.random() * 1000000);

    if (isPureChat) {
      router.push(`/test/splitter/chat/${randomChatId}`);
      return;
    }

    const route = isChat
      ? `/test/splitter/chat/${randomChatId}/${randomType}/${randomId}`
      : `/test/splitter/${randomType}/${randomId}`;
    router.push(route);
  });

  return (
    <div className="h-screen w-screen">
      <ChatLayout selectedLayout={selectedLayout} selectedFile={selectedFile} />
    </div>
  );
}
