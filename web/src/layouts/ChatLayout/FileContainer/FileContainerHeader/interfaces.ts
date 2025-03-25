import { FileView } from '../../ChatLayoutContext/useChatFileLayout';

export interface FileContainerSegmentProps {
  selectedFileView: FileView | undefined;
  selectedFileId: string | undefined;
}

export interface FileContainerButtonsProps {
  selectedFileView: FileView | undefined;
}
