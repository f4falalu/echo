'use client';

import { ChatSplitter } from '@/app/app/_components/ChatSplitter';
import { SelectedFile } from '@/app/app/_components/ChatSplitter/interfaces';
import { useHotkeys } from 'react-hotkeys-hook';
import { AppChatMessageFileType } from '@/components/messages/AppChatMessageContainer';
import { useState } from 'react';

export default function Page() {
  const [defaultFile, setDefaultFile] = useState<SelectedFile | undefined>({
    id: '1',
    type: 'dataset'
  });

  useHotkeys('m', () => {
    const randomType: AppChatMessageFileType = (
      ['dataset', 'collection', 'metric', 'dashboard'] as AppChatMessageFileType[]
    )[Math.floor(Math.random() * 4)];
    const randomId = Math.floor(Math.random() * 1000000);

    setDefaultFile({ id: randomId.toString(), type: randomType });
  });

  return (
    <div className="h-screen w-screen">
      <ChatSplitter defaultShowLayout="chat" defaultSelectedFile={defaultFile} />
    </div>
  );
}
