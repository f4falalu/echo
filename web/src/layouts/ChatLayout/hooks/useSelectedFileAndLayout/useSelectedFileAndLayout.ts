'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ChatLayoutView, SelectedFile } from '../../interfaces';
import { usePathname } from 'next/navigation';
import { parsePathnameSegments } from './parsePathnameSegments';
import { useMemoizedFn } from 'ahooks';
import { createChatAssetRoute, createFileRoute } from '../../ChatLayoutContext/helpers';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { initializeSelectedFile } from './initializeSelectedFile';

export const useSelectedFileAndLayout = ({
  animateOpenSplitter
}: {
  animateOpenSplitter: (side: 'left' | 'right' | 'both') => void;
}) => {
  const onChangePage = useAppLayoutContextSelector((state) => state.onChangePage);
  const pathname = usePathname();
  const params = useMemo(() => parsePathnameSegments(pathname), [pathname]);
  const [isPending, startTransition] = useTransition();

  const { chatId } = params;

  const [selectedFile, setSelectedFile] = useState<SelectedFile | undefined>(() =>
    initializeSelectedFile(params)
  );

  const selectedLayout: ChatLayoutView = useMemo(() => {
    if (chatId) {
      if (selectedFile) return 'both';
      return 'chat';
    }

    if (selectedFile) return 'file';

    return 'chat';
  }, [selectedFile]);

  const [renderViewLayoutKey, setRenderViewLayoutKey] = useState<ChatLayoutView>(
    selectedLayout || 'chat'
  );

  const onSetSelectedFile = useMemoizedFn(async (file: SelectedFile) => {
    const fileType = file.type;
    const fileId = file.id;
    const route =
      chatId !== undefined
        ? createChatAssetRoute({ chatId, assetId: fileId, type: fileType })
        : createFileRoute({ assetId: fileId, type: fileType });

    setRenderViewLayoutKey('both');
    setSelectedFile(file);
    onChangePage(route);

    startTransition(() => {
      animateOpenSplitter('both');
    });
  });

  return {
    onSetSelectedFile,
    selectedFile,
    selectedLayout,
    chatId,
    renderViewLayoutKey,
    setRenderViewLayoutKey
  };
};

export type SelectedFileParams = ReturnType<typeof useSelectedFileAndLayout>;
