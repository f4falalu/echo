import type { PlateEditor } from 'platejs/react';
import { NodeTypeLabels } from '../config/labels';
import { buildExportHtml } from './buildExportHtml';

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

    // Open a print window with the rendered HTML so the user can save as PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) throw new Error('Unable to open print window');

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Close the print window after the user prints or cancels
    const handleAfterPrint = () => {
      try {
        //  printWindow.close();
      } catch (e) {
        console.error('Failed to close print window', e);
      }
    };
    printWindow.addEventListener('afterprint', handleAfterPrint);

    // Trigger print when resources are loaded
    const triggerPrint = () => {
      try {
        printWindow.focus();
        // Set the title for the print window so the OS save dialog suggests it
        printWindow.document.title = filename;
        printWindow.print();
      } catch (e) {
        console.error('Failed to trigger print dialog', e);
      }
    };

    if (printWindow.document.readyState === 'complete') {
      // Give a brief moment for styles to apply
      setTimeout(triggerPrint, 100);
    } else {
      printWindow.addEventListener('load', () => setTimeout(triggerPrint, 100));
    }

    openInfoMessage?.(NodeTypeLabels.pdfExportedSuccessfully.label);
  } catch (error) {
    console.error(error);
    openErrorMessage?.(NodeTypeLabels.failedToExportPdf.label);
  }
};

export default exportToPdf;
