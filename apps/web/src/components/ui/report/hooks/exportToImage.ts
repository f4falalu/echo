import type { PlateEditor } from 'platejs/react';
import { NodeTypeLabels } from '../config/labels';
import { downloadFile } from './downloadFile';
import { getCanvas } from './getCanvas';

type Notifier = (message: string) => void;

type ExportToImageOptions = {
  editor: PlateEditor;
  filename?: string;
  openInfoMessage?: Notifier;
  openErrorMessage?: Notifier;
};

export const exportToImage = async ({
  editor,
  filename = 'plate.png',
  openInfoMessage,
  openErrorMessage,
}: ExportToImageOptions) => {
  try {
    const canvas = await getCanvas(editor);
    await downloadFile(canvas.toDataURL('image/png'), filename);
    openInfoMessage?.(NodeTypeLabels.imageExportedSuccessfully.label);
  } catch (error) {
    console.error(error);
    openErrorMessage?.(NodeTypeLabels.failedToExportImage.label);
  }
};

export default exportToImage;
