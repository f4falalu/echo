import { FileType } from '@/api/buster_socket/chats';
import { useMemo, useState } from 'react';
import { FileConfig, FileView, FileViewConfig, FileViewSecondary } from './interfaces';
import { useMemoizedFn } from 'ahooks';

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
  }, [fileViews, selectedFileId]);

  const selectedFileViewConfig: FileViewConfig | undefined = useMemo(() => {
    if (!selectedFileId) return undefined;
    return fileViews[selectedFileId]?.fileViewConfig;
  }, [fileViews, selectedFileId]);

  const selectedFileViewSecondary: FileViewSecondary | null = useMemo(() => {
    if (!selectedFileId || !selectedFileViewConfig || !selectedFileView) return null;
    return selectedFileViewConfig?.[selectedFileView]?.secondaryView ?? null;
  }, [selectedFileViewConfig, selectedFileId, selectedFileView]);

  return {
    selectedFileType,
    selectedFileView,
    selectedFileViewSecondary,
    onSetFileView
  };
};

const defaultFileView: Record<FileType, FileView> = {
  collection: 'results',
  metric: 'chart',
  value: 'results',
  term: 'results',
  dataset: 'results',
  dashboard: 'results'
};
