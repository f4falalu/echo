'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { ChatLayoutView, SelectedFile } from '../../interfaces';
import { usePathname } from 'next/navigation';
import { parsePathnameSegments } from './parsePathnameSegments';
import { useMemoizedFn, useWhyDidYouUpdate } from '@/hooks';
import { createChatAssetRoute, createChatRoute } from '../../ChatLayoutContext/helpers';
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

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(() =>
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
    const isSameAsCurrentFile = file?.id === selectedFile?.id;

    // Handle file deselection or invalid file data
    if (!file?.type || !file?.id || !chatId || isSameAsCurrentFile) {
      const route = chatId
        ? createChatRoute(chatId)
        : createBusterRoute({ route: BusterRoutes.APP_HOME });

      setSelectedFile(null);
      await onChangePage(route);

      if (chatId) {
        animateOpenSplitter('left');
      }
      return;
    }

    // Handle valid file selection
    const route = createChatAssetRoute({
      chatId,
      assetId: file.id,
      type: file.type
    });

    setRenderViewLayoutKey('both');
    setSelectedFile(file);
    await onChangePage(route);
    startTransition(() => {
      onChangePage(route); //this is hack for now...
      animateOpenSplitter(isSameAsCurrentFile ? 'left' : 'both');
    });
  });

  useEffect(() => {
    setSelectedFile(initializeSelectedFile(params));
  }, [Object.keys(params).join('')]);

  return useMemo(
    () => ({
      onSetSelectedFile,
      selectedFile,
      selectedLayout,
      chatId,
      renderViewLayoutKey,
      setRenderViewLayoutKey
    }),
    [onSetSelectedFile, selectedFile, selectedLayout, chatId, renderViewLayoutKey]
  );
};

export type SelectedFileParams = ReturnType<typeof useSelectedFileAndLayout>;
