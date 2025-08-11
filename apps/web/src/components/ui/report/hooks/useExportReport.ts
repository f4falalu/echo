import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemo } from 'react';
import { exportToPdf } from './exportToPdf';
import { exportToImage } from './exportToImage';
import { exportToHtml } from './exportToHtml';
import { exportToMarkdown } from './exportToMarkdown';

export const useExportReport = () => {
  const { openErrorMessage, openInfoMessage } = useBusterNotifications();

  const exportToPdfLocal = async (params: Parameters<typeof exportToPdf>[0]) =>
    exportToPdf({ ...params, openInfoMessage, openErrorMessage });

  const exportToImageLocal = async (params: Parameters<typeof exportToImage>[0]) =>
    exportToImage({ ...params, openInfoMessage, openErrorMessage });

  const exportToHtmlLocal = async (params: Parameters<typeof exportToHtml>[0]) =>
    exportToHtml({ ...params, openInfoMessage, openErrorMessage });

  const exportToMarkdownLocal = async (params: Parameters<typeof exportToMarkdown>[0]) =>
    exportToMarkdown({ ...params, openInfoMessage, openErrorMessage });

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
