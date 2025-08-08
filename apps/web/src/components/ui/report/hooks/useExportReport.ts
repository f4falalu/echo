import { EditorStatic } from '../elements/EditorStatic';
import { useBusterNotifications } from '@/context/BusterNotifications';
import type { PlateEditor } from 'platejs/react';
import { NodeTypeLabels } from '../config/labels';
import { createSlateEditor, serializeHtml } from 'platejs';
import { MarkdownPlugin } from '@platejs/markdown';
import { useMemo } from 'react';

export const useExportReport = () => {
  const { openErrorMessage, openInfoMessage } = useBusterNotifications();

  // Build a complete HTML document string for export, rasterizing
  // metric elements (which may contain canvas) into <img> tags AND
  // inlining computed CSS styles so no external CSS is required.
  const buildExportHtml = async (editor: PlateEditor): Promise<string> => {
    // Prefer using the live editor DOM to inline computed styles
    const liveRoot = document.querySelector('[contenteditable="true"]') as HTMLElement | null;

    // Create images for each metric element from the LIVE DOM (if available)
    const { default: html2canvas } = await import('html2canvas-pro');
    const metricDataUrls: string[] = [];
    const liveMetricFigures = liveRoot
      ? (Array.from(
          liveRoot.querySelectorAll('[data-export-metric] [data-metric-figure]')
        ) as HTMLElement[])
      : [];

    for (const figureEl of liveMetricFigures) {
      try {
        const canvas = await html2canvas(figureEl, { backgroundColor: null });
        metricDataUrls.push(canvas.toDataURL('image/png'));
      } catch (e) {
        console.error('Failed to rasterize metric element for HTML export', e);
        metricDataUrls.push('');
      }
    }

    let contentHtml = '';

    if (liveRoot) {
      // Clone live DOM subtree and inline computed styles
      const clonedRoot = liveRoot.cloneNode(true) as HTMLElement;

      // Replace metric figures with <img> tags in the clone
      const clonedMetricFigures = Array.from(
        clonedRoot.querySelectorAll('[data-export-metric] [data-metric-figure]')
      );
      clonedMetricFigures.forEach((node, index) => {
        const dataUrl = metricDataUrls[index];
        if (!dataUrl) return;
        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'Metric';
        (img.style as CSSStyleDeclaration).width = '100%';
        (img.style as CSSStyleDeclaration).height = 'auto';
        node.replaceWith(img);
      });

      // Inline computed styles by pairing original and clone nodes in order
      const originals = [liveRoot, ...Array.from(liveRoot.querySelectorAll('*'))];
      const clones = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll('*'))];
      for (let i = 0; i < originals.length; i++) {
        const orig = originals[i] as HTMLElement;
        const clone = clones[i] as HTMLElement | undefined;
        if (!clone) continue;
        const computed = window.getComputedStyle(orig);
        const parts: string[] = [];
        for (let j = 0; j < computed.length; j++) {
          const propName = computed.item(j);
          if (!propName) continue;
          const value = computed.getPropertyValue(propName);
          if (!value) continue;
          parts.push(`${propName}: ${value};`);
        }
        const existing = clone.getAttribute('style') || '';
        clone.setAttribute('style', `${existing}; ${parts.join(' ')}`.trim());
        // Remove interactive attributes
        clone.removeAttribute('contenteditable');
        clone.removeAttribute('draggable');
        clone.removeAttribute('spellcheck');
      }

      // Wrap content with a fixed width container for consistency
      const wrapper = document.createElement('div');
      wrapper.setAttribute(
        'style',
        'width: 850px; max-width: 850px; min-width: 850px; margin: 0 auto;'
      );
      wrapper.appendChild(clonedRoot);
      contentHtml = wrapper.outerHTML;
    } else {
      // Fallback: serialize using static editor and include minimal inline styles
      const BaseEditorKit = await import('../editor-base-kit').then(
        (module) => module.BaseEditorKit
      );

      const editorStatic = createSlateEditor({
        plugins: BaseEditorKit,
        value: editor.children
      });

      const serializedHtml = await serializeHtml(editorStatic, {
        editorComponent: EditorStatic,
        props: { style: { padding: '0 calc(50% - 350px)', paddingBottom: '' } }
      });

      // Replace metric figures in serialized HTML
      const container = document.createElement('div');
      container.innerHTML = serializedHtml;
      const clonedMetricFiguresFallback = Array.from(
        container.querySelectorAll('[data-export-metric] [data-metric-figure]')
      );
      clonedMetricFiguresFallback.forEach((node, index) => {
        const dataUrl = metricDataUrls[index];
        if (!dataUrl) return;
        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'Metric';
        (img.style as CSSStyleDeclaration).width = '100%';
        (img.style as CSSStyleDeclaration).height = 'auto';
        node.replaceWith(img);
      });
      contentHtml = container.innerHTML;
    }

    // Build a minimal HTML document without external CSS
    const html = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="color-scheme" content="light dark" />
          <style>
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>`;

    return html;
  };

  const getCanvas = async (editor: PlateEditor) => {
    const { default: html2canvas } = await import('html2canvas-pro');

    // Create a temporary style element to isolate any styles needed during export.
    // Ensure it is always cleaned up, even if an error occurs during rendering.
    const style = document.createElement('style');
    style.setAttribute('data-report-export-style', 'true');
    document.head.append(style);

    // Standard width for consistent PDF output (equivalent to A4 width with margins)
    const standardWidth = '850px';

    const node = editor.api.toDOMNode(editor)!;

    if (!node) {
      // Ensure cleanup of style element if editor is missing
      style.remove();
      throw new Error('Editor not found');
    }

    try {
      const canvas = await html2canvas(node, {
        onclone: (document: Document) => {
          const editorElement = document.querySelector('[contenteditable="true"]');
          if (editorElement) {
            // Force consistent width for the editor element
            const existingStyle = editorElement.getAttribute('style') || '';
            editorElement.setAttribute(
              'style',
              `${existingStyle}; width: ${standardWidth} !important; max-width: ${standardWidth} !important; min-width: ${standardWidth} !important;`
            );

            // Apply consistent font family to all elements
            Array.from(editorElement.querySelectorAll('*')).forEach((element) => {
              const elementStyle = element.getAttribute('style') || '';
              element.setAttribute(
                'style',
                `${elementStyle}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important`
              );
            });
          } else {
            throw new Error('Editor element not found');
          }
        }
      });
      return canvas;
    } finally {
      // Always remove temporary style tag
      style.remove();
    }
  };

  const downloadFile = async (url: string, filename: string) => {
    const response = await fetch(url);

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();

    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);
  };

  const exportToPdf = async (editor: PlateEditor) => {
    try {
      const html = await buildExportHtml(editor);

      // Open a print window with the rendered HTML so the user can save as PDF
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('Unable to open print window');

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      // Trigger print when resources are loaded
      const triggerPrint = () => {
        try {
          printWindow.focus();
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

      openInfoMessage(NodeTypeLabels.pdfExportedSuccessfully.label);
    } catch (error) {
      console.error(error);
      openErrorMessage(NodeTypeLabels.failedToExportPdf.label);
    }
  };

  const exportToImage = async (editor: PlateEditor) => {
    try {
      const canvas = await getCanvas(editor);
      await downloadFile(canvas.toDataURL('image/png'), 'plate.png');
      openInfoMessage(NodeTypeLabels.imageExportedSuccessfully.label);
    } catch (error) {
      console.error(error);
      openErrorMessage(NodeTypeLabels.failedToExportImage.label);
    }
  };

  const exportToHtml = async (editor: PlateEditor) => {
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

  const exportToMarkdown = async (editor: PlateEditor) => {
    try {
      const md = editor.getApi(MarkdownPlugin).markdown.serialize();
      const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(md)}`;
      await downloadFile(url, 'plate.md');
      openInfoMessage(NodeTypeLabels.markdownExportedSuccessfully.label);
    } catch (error) {
      console.error(error);
      openErrorMessage(NodeTypeLabels.failedToExportMarkdown.label);
    }
  };

  return useMemo(
    () => ({
      exportToPdf,
      exportToImage,
      exportToHtml,
      exportToMarkdown
    }),
    []
  );
};
