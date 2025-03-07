import { FileType } from '@/api/asset_interfaces';
import { useMemo, useState } from 'react';
import { FileConfig, FileView, FileViewConfig, FileViewSecondary } from './interfaces';
import { useMemoizedFn } from 'ahooks';
import { create } from 'mutative';

export const useChatFileLayout = ({
  selectedFileId,
  selectedFileType
}: {
  selectedFileId: string | undefined;
  selectedFileType: FileType | undefined;
}) => {
  const [fileViews, setFileViews] = useState<Record<string, FileConfig>>({});

  const onSetFileView = useMemoizedFn(
    ({
      fileView,
      fileId,
      secondaryView
    }: {
      fileView?: FileView;
      fileId?: string;
      secondaryView?: FileViewSecondary;
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
              secondaryView
            }
          };
        }

        return { ...prev, [id]: newFileConfig };
      });
    }
  );

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

  const closeSecondaryView = useMemoizedFn(() => {
    if (!selectedFileId || !selectedFileViewConfig || !selectedFileView) return;
    setFileViews(
      create((draft) => {
        if (!draft[selectedFileId]?.fileViewConfig?.[selectedFileView]) return;
        draft[selectedFileId].fileViewConfig[selectedFileView].secondaryView = null;
      })
    );
  });

  return {
    selectedFileView,
    selectedFileViewSecondary,
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
