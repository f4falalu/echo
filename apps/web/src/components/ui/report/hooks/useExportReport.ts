import { useBusterNotifications } from '@/context/BusterNotifications';
import type { PlateEditor } from 'platejs/react';
import { useMemo } from 'react';
import { exportToPdf } from './exportToPdf';
import { exportToImage } from './exportToImage';
import { exportToHtml } from './exportToHtml';
import { exportToMarkdown } from './exportToMarkdown';

export const useExportReport = () => {
  const { openErrorMessage, openInfoMessage } = useBusterNotifications();

  const exportToPdfLocal = async (editor: PlateEditor) =>
    exportToPdf(editor, openInfoMessage, openErrorMessage);

  const exportToImageLocal = async (editor: PlateEditor) =>
    exportToImage(editor, openInfoMessage, openErrorMessage);

  const exportToHtmlLocal = async (editor: PlateEditor) =>
    exportToHtml(editor, openInfoMessage, openErrorMessage);

  const exportToMarkdownLocal = async (editor: PlateEditor) =>
    exportToMarkdown(editor, openInfoMessage, openErrorMessage);

  return useMemo(
    () => ({
      exportToPdf: exportToPdfLocal,
      exportToImage: exportToImageLocal,
      exportToHtml: exportToHtmlLocal,
      exportToMarkdown: exportToMarkdownLocal
    }),
    []
  );
};
