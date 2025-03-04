'use client';

import React from 'react';
import { ChatLayout, useSelectedFileByParams } from '@/layouts/ChatLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { selectedFile, selectedLayout, chatId } = useSelectedFileByParams();

  return (
    <ChatLayout
      chatId={chatId}
      defaultSelectedLayout={selectedLayout}
      defaultSelectedFile={selectedFile}>
      {children}
    </ChatLayout>
  );
}
