'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { ChatLayoutView, SelectedFile } from '../../interfaces';
import { usePathname, useSearchParams } from 'next/navigation';
import { parsePathnameSegments } from './parsePathnameSegments';
import { useMemoizedFn } from '@/hooks';
import { createChatAssetRoute, createChatRoute } from '../helpers';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { initializeSelectedFile } from './initializeSelectedFile';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const useSelectedFile = ({
  animateOpenSplitter
}: {
  animateOpenSplitter: (side: 'left' | 'right' | 'both') => void;
}) => {
  const onChangePage = useAppLayoutContextSelector((state) => state.onChangePage);
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  const metricVersionNumber = searchParams.get('metric_version_number');
  const dashboardVersionNumber = searchParams.get('dashboard_version_number');
  const isVersionHistoryMode = useMemo(() => {
    if (selectedFile?.type === 'metric') return !!metricVersionNumber;
    if (selectedFile?.type === 'dashboard') return !!dashboardVersionNumber;
    return false;
  }, [selectedFile?.type, metricVersionNumber, dashboardVersionNumber]);

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
      isVersionHistoryMode,
      onSetSelectedFile,
      selectedFile,
      selectedLayout,
      chatId,
      renderViewLayoutKey,
      setRenderViewLayoutKey
    }),
    [
      onSetSelectedFile,
      isVersionHistoryMode,
      selectedFile,
      selectedLayout,
      chatId,
      renderViewLayoutKey
    ]
  );
};

export type SelectedFileParams = ReturnType<typeof useSelectedFile>;
