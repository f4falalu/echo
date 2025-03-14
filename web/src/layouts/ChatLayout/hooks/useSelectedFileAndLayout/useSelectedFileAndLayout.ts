'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ChatLayoutView, SelectedFile } from '../../interfaces';
import { usePathname } from 'next/navigation';
import { parsePathnameSegments } from './parsePathnameSegments';
import { useMemoizedFn } from '@/hooks';
import {
  createChatAssetRoute,
  createChatRoute,
  createFileRoute
} from '../../ChatLayoutContext/helpers';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { initializeSelectedFile } from './initializeSelectedFile';
import { BusterRoutes, createBusterRoute } from '@/routes';

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

    return 'file';
  }, [selectedFile]);

  const [renderViewLayoutKey, setRenderViewLayoutKey] = useState<ChatLayoutView>(
    selectedLayout || 'chat'
  );

  const onSetSelectedFile = useMemoizedFn(async (file: SelectedFile | null) => {
    const fileType = file?.type;
    const fileId = file?.id;
    const isSameAsCurrentFile = selectedFile?.id === fileId;

    if (!file || !fileType || !fileId || !chatId) {
      if (chatId) {
        await onChangePage(createChatRoute(chatId));
        animateOpenSplitter('left');
      } else {
        await onChangePage(createBusterRoute({ route: BusterRoutes.APP_HOME }));
      }
      return;
    }

    const route = isSameAsCurrentFile
      ? createChatRoute(chatId)
      : createChatAssetRoute({ chatId, assetId: fileId, type: fileType });
    setRenderViewLayoutKey('both');
    setSelectedFile(isSameAsCurrentFile ? undefined : file);
    await onChangePage(route);
    startTransition(() => {
      onChangePage(route); //this is hack for now...
      animateOpenSplitter(isSameAsCurrentFile ? 'left' : 'both');
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
