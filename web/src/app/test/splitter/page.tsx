'use client';

import { AppSplitterRef } from '@/components';
import { useRef, useState } from 'react';
import { Button } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { ChatSplitter } from '@/app/app/_components/ChatSplitter';
import { SelectedFile } from '@/app/app/_components/ChatSplitter/interfaces';

export default function Page() {
  const [toggleClose, setToggleClose] = useState(false);
  const ref = useRef<AppSplitterRef>(null);

  const [defaultFile, setDefaultFile] = useState<SelectedFile | undefined>(undefined);

  const onToggleClick = useMemoizedFn(() => {
    if (toggleClose) {
      ref.current?.animateWidth('50%', 'right');
      setToggleClose(false);
    } else {
      ref.current?.animateWidth('0%', 'right');
      setToggleClose(true);
    }
  });

  return (
    <div className="h-screen w-screen border">
      <ChatSplitter chatHeaderText="Chat" defaultSelectedFile={defaultFile} />

      <Button onClick={() => setDefaultFile({ id: '1', type: 'metric' })}>Set Default File</Button>
    </div>
  );
}
