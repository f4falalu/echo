'use client';

import { FileType } from '@/api/asset_interfaces/chat';
import { useLayoutEffect, useMemo, useState } from 'react';
import { FileConfig, FileView, FileViewConfig, FileViewSecondary } from './interfaces';
import { useMemoizedFn } from '@/hooks';
import { create } from 'mutative';
import { ChatLayoutView } from '../../interfaces';
import type { SelectedFile } from '../../interfaces';
import { timeout } from '@/lib';
import { useRouter } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { SelectedFileSecondaryRenderRecord } from '../../FileContainer/FileContainerSecondary';
import { ChatParams } from '../useGetChatParams';
import { initializeFileViews } from './helpers';
import { DEFAULT_FILE_VIEW } from '../helpers';

export const useLayoutConfig = ({
  selectedFile,
  isVersionHistoryMode,
  chatId,
  onSetSelectedFile,
  animateOpenSplitter,
  metricId,
  dashboardId,
  currentRoute
}: {
  selectedFile: SelectedFile | null;
  isVersionHistoryMode: boolean;
  chatId: string | undefined;
  animateOpenSplitter: (side: 'left' | 'right' | 'both') => void;
  onSetSelectedFile: (file: SelectedFile | null) => void;
} & ChatParams) => {
  const router = useRouter();
  const [fileViews, setFileViews] = useState<Record<string, FileConfig>>(
    initializeFileViews({ metricId, dashboardId, currentRoute })
  );

  const selectedFileId = selectedFile?.id;
  const selectedFileType = selectedFile?.type;

  const selectedFileView: FileView | undefined = useMemo(() => {
    if (!selectedFileId) return undefined;
    return (
      fileViews[selectedFileId]?.selectedFileView || DEFAULT_FILE_VIEW[selectedFileType as FileType]
    );
  }, [fileViews, selectedFileId, selectedFileType]);

  const selectedFileViewConfig: FileViewConfig | undefined = useMemo(() => {
    if (!selectedFileId) return undefined;
    return fileViews[selectedFileId]?.fileViewConfig;
  }, [fileViews, selectedFileId]);

  const selectedFileViewSecondary: FileViewSecondary | null = useMemo(() => {
    if (!selectedFileId || !selectedFileViewConfig || !selectedFileView) return null;
    return selectedFileViewConfig?.[selectedFileView]?.secondaryView ?? null;
  }, [selectedFileViewConfig, selectedFileId, selectedFileView]);

  const selectedFileViewRenderSecondary: boolean = useMemo(() => {
    if (!selectedFileViewSecondary || !selectedFileType) return false;
    if (
      selectedFileType in SelectedFileSecondaryRenderRecord &&
      SelectedFileSecondaryRenderRecord[selectedFileType as FileType]?.[
        selectedFileViewSecondary
      ] !== undefined
    ) {
      return (
        SelectedFileSecondaryRenderRecord[selectedFileType as FileType]?.[
          selectedFileViewSecondary
        ] ?? false
      );
    }
    return true;
  }, [selectedFileViewConfig, selectedFileId, selectedFileView, selectedFileType]);

  const onSetFileView = useMemoizedFn(
    async ({
      fileView,
      fileId: fileIdProp,
      secondaryView
    }: {
      fileView?: FileView;
      fileId?: string | undefined;
      secondaryView?: FileViewSecondary;
    }) => {
      const fileId = fileIdProp ?? selectedFileId;
      if (!fileId) return;

      if (secondaryView) {
        animateOpenSplitter('right');
        await timeout(250); //wait for splitter to close before opening secondary view
      } else if (chatId) {
        animateOpenSplitter('both');
      }

      setFileViews((prev) => {
        return create(prev, (draft) => {
          if (!draft[fileId]) {
            draft[fileId] = {
              selectedFileView: DEFAULT_FILE_VIEW[selectedFileType as FileType] || 'file',
              fileViewConfig: {}
            };
          }

          const usedFileView =
            fileView ??
            draft[fileId].selectedFileView ??
            DEFAULT_FILE_VIEW[selectedFileType as FileType];

          if (fileView !== undefined) {
            draft[fileId].selectedFileView = fileView;
          }

          if (secondaryView !== undefined) {
            if (!draft[fileId].fileViewConfig) {
              draft[fileId].fileViewConfig = {};
            }

            draft[fileId].fileViewConfig[usedFileView] = {
              ...(draft[fileId].fileViewConfig[usedFileView] || {}),
              secondaryView
            };
          }
        });
      });
    }
  );

  const closeSecondaryView = useMemoizedFn(() => {
    if (!selectedFileId || !selectedFileViewConfig || !selectedFileView) return;
    setFileViews((prev) => {
      return create(prev, (draft) => {
        if (!draft[selectedFileId]?.fileViewConfig?.[selectedFileView]) return;
        draft[selectedFileId].fileViewConfig[selectedFileView].secondaryView = null;
      });
    });
  });

  const onCollapseFileClick = useMemoizedFn((navigateToChat: boolean = true) => {
    onSetSelectedFile(null);
    closeSecondaryView();
    if (navigateToChat && chatId) {
      router.prefetch(
        createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID,
          chatId
        })
      );
      setTimeout(() => {
        router.push(
          createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID,
            chatId
          })
        );
      }, 250); //wait for the panel to close before navigating
    }
  });

  const selectedLayout: ChatLayoutView = useMemo(() => {
    if (chatId) {
      if (selectedFileId) return 'both';
      return 'chat';
    }
    return 'file';
  }, [selectedFileId]);

  useLayoutEffect(() => {
    if (
      isVersionHistoryMode &&
      selectedFileId &&
      (selectedFileType === 'metric' || selectedFileType === 'dashboard')
    ) {
      const fileView = selectedFileType === 'metric' ? 'chart' : 'dashboard';
      onSetFileView({
        fileId: selectedFileId,
        fileView,
        secondaryView: 'version-history'
      });
    }
  }, [isVersionHistoryMode, selectedFileId]);

  return useMemo(
    () => ({
      selectedLayout,
      selectedFileView,
      selectedFileViewSecondary,
      selectedFileViewRenderSecondary,
      onSetFileView,
      closeSecondaryView,
      onCollapseFileClick
    }),
    [
      selectedLayout,
      selectedFileView,
      selectedFileViewSecondary,
      selectedFileViewRenderSecondary,
      onSetFileView,
      closeSecondaryView,
      onCollapseFileClick
    ]
  );
};
