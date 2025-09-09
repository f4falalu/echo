import type { PlateEditor } from 'platejs/react';
import { NodeTypeLabels } from '../config/labels';
import { buildExportHtml } from './buildExportHtml';
import { downloadFile } from './downloadFile';

type Notifier = (message: string) => void;

type ExportToHtmlOptions = {
  editor: PlateEditor;
  filename?: string;
  openInfoMessage?: Notifier;
  openErrorMessage?: Notifier;
};

export const exportToHtml = async ({
  editor,
  filename = 'buster-report.html',
  openInfoMessage,
  openErrorMessage,
}: ExportToHtmlOptions) => {
  try {
    const html = await buildExportHtml(editor, { title: filename.replace(/\.html$/i, '') });
    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    await downloadFile(url, filename);
    openInfoMessage?.(NodeTypeLabels.htmlExportedSuccessfully.label);
  } catch (error) {
    console.error(error);
    openErrorMessage?.(NodeTypeLabels.failedToExportHtml.label);
  }
};

export default exportToHtml;
