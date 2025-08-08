import type { PlateEditor } from 'platejs/react';
import { NodeTypeLabels } from '../config/labels';
import { buildExportHtml } from './buildExportHtml';
import { printHTMLPage } from './printHTMLPage';

type Notifier = (message: string) => void;

type ExportToPdfOptions = {
  filename?: string;
  openInfoMessage?: Notifier;
  openErrorMessage?: Notifier;
  editor: PlateEditor;
};

export const exportToPdf = async ({
  editor,
  filename = 'Buster Report',
  openInfoMessage,
  openErrorMessage
}: ExportToPdfOptions) => {
  try {
    const html = await buildExportHtml(editor, { title: filename });

    printHTMLPage({ html, filename });

    openInfoMessage?.(NodeTypeLabels.pdfExportedSuccessfully.label);
  } catch (error) {
    console.error(error);
    openErrorMessage?.(NodeTypeLabels.failedToExportPdf.label);
  }
};

export default exportToPdf;
