import type { PlateEditor } from 'platejs/react';
import { NodeTypeLabels } from '../config/labels';
import { getCanvas } from './getCanvas';
import { downloadFile } from './downloadFile';

type Notifier = (message: string) => void;

export const exportToImage = async (
  editor: PlateEditor,
  openInfoMessage: Notifier,
  openErrorMessage: Notifier
) => {
  try {
    const canvas = await getCanvas(editor);
    await downloadFile(canvas.toDataURL('image/png'), 'plate.png');
    openInfoMessage(NodeTypeLabels.imageExportedSuccessfully.label);
  } catch (error) {
    console.error(error);
    openErrorMessage(NodeTypeLabels.failedToExportImage.label);
  }
};

export default exportToImage;


