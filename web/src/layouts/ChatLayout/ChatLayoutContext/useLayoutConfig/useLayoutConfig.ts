'use client';

import { FileType } from '@/api/asset_interfaces';
import { useLayoutEffect, useMemo, useState } from 'react';
import { FileConfig, FileView, FileViewConfig, FileViewSecondary } from './interfaces';
import { useMemoizedFn } from '@/hooks';
import { create } from 'mutative';

export const useLayoutConfig = ({
  selectedFileId,
  selectedFileType,
  isVersionHistoryMode
}: {
  selectedFileId: string | undefined;
  selectedFileType: FileType | undefined;
  isVersionHistoryMode: boolean;
}) => {
  const [fileViews, setFileViews] = useState<Record<string, FileConfig>>({});

  const selectedFileView: FileView | undefined = useMemo(() => {
    if (!selectedFileId) return undefined;
    return (
      fileViews[selectedFileId]?.selectedFileView || defaultFileView[selectedFileType as FileType]
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
      fileId,
      secondaryView,
      renderView
    }: {
      fileView?: FileView;
      fileId?: string;
      secondaryView?: FileViewSecondary;
      renderView?: boolean;
    }) => {
      const id = fileId ?? selectedFileId;
      if (!id) return;
      setFileViews((prev) => {
        const newFileConfig: FileConfig = { ...prev[id] };
        const usedFileView =
          fileView ??
          newFileConfig.selectedFileView ??
          defaultFileView[selectedFileType as FileType];

        if (fileView !== undefined) {
          newFileConfig.selectedFileView = fileView;
        }

        if (secondaryView !== undefined) {
          newFileConfig.fileViewConfig = {
            ...newFileConfig.fileViewConfig,
            [usedFileView]: {
              ...newFileConfig.fileViewConfig?.[usedFileView],
              secondaryView,
              renderView
            }
          };
        }

        return { ...prev, [id]: newFileConfig };
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
    selectedFileView,
    selectedFileViewSecondary,
    selectedFileViewRenderSecondary,
    onSetFileView,
    closeSecondaryView
  };
};

const defaultFileView: Record<FileType, FileView> = {
  metric: 'chart',
  dashboard: 'dashboard',
  reasoning: 'reasoning'
  // collection: 'results',
  // value: 'results',
  // term: 'results',
  // dataset: 'results',
};
