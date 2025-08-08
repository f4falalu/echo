import type { PlateEditor } from 'platejs/react';
import { NodeTypeLabels } from '../config/labels';
import { buildExportHtml } from './buildExportHtml';
import { downloadFile } from './downloadFile';

type Notifier = (message: string) => void;

export const exportToHtml = async (
  editor: PlateEditor,
  openInfoMessage: Notifier,
  openErrorMessage: Notifier
) => {
  try {
    const html = await buildExportHtml(editor);
    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    await downloadFile(url, 'plate.html');
    openInfoMessage(NodeTypeLabels.htmlExportedSuccessfully.label);
  } catch (error) {
    console.error(error);
    openErrorMessage(NodeTypeLabels.failedToExportHtml.label);
  }
};

export default exportToHtml;


