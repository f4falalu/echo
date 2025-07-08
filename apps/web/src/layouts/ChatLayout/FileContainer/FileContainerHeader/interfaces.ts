import type { FileView } from '../../ChatLayoutContext/useLayoutConfig';

export type FileContainerSegmentProps = {
  selectedFileView: FileView | undefined;
  selectedFileId: string | undefined;
  chatId: string | undefined;
  overrideOldVersionMessage?: boolean;
  isVersionHistoryMode: boolean;
};

export type FileContainerButtonsProps = {
  selectedFileView: FileView | undefined;
  selectedFileId: string | undefined;
};
