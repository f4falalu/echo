'use client';

import { FileType } from '@/api/asset_interfaces';
import { useLayoutEffect, useMemo, useState } from 'react';
import { FileConfig, FileView, FileViewConfig, FileViewSecondary } from './interfaces';
import { useMemoizedFn } from '@/hooks';
import { create } from 'mutative';
import { ChatLayoutView } from '../../interfaces';
import type { SelectedFile } from '../../interfaces';

export const useLayoutConfig = ({
  selectedFile,
  isVersionHistoryMode,
  chatId
}: {
  selectedFile: SelectedFile | null;
  isVersionHistoryMode: boolean;
  chatId: string | undefined;
}) => {
  const [fileViews, setFileViews] = useState<Record<string, FileConfig>>({});

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
    if (!selectedFileId || !selectedFileViewConfig || !selectedFileView) return false;
    if (selectedFileViewConfig?.[selectedFileView]?.secondaryView) {
      return selectedFileViewConfig?.[selectedFileView]?.renderView !== false;
    }
    return false;
  }, [selectedFileViewConfig]);

  const onSetFileView = useMemoizedFn(
    ({
      fileView,
      fileId: fileIdProp,
      secondaryView,
      renderView
    }: {
      fileView?: FileView;
      fileId?: string | undefined;
      secondaryView?: FileViewSecondary;
      renderView?: boolean;
    }) => {
      const fileId = fileIdProp ?? selectedFileId;
      if (!fileId) return;
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
              secondaryView,
              renderView
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

  return {
    selectedLayout,
    selectedFileView,
    selectedFileViewSecondary,
    selectedFileViewRenderSecondary,
    onSetFileView,
    closeSecondaryView
  };
};

const DEFAULT_FILE_VIEW: Record<FileType, FileView> = {
  metric: 'chart',
  dashboard: 'dashboard',
  reasoning: 'reasoning'
  // collection: 'results',
  // value: 'results',
  // term: 'results',
  // dataset: 'results',
};
