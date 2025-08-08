'use client';

import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useRef, useState } from 'react';
import { ReportPageController } from './ReportPageController';
import { printHTMLPage } from '@/lib/print';
import { timeout } from '@/lib';

const ExportContainerComponent: React.FC<{
  reportId: string;
  reportName: string;
  buildHtmlMethod: (node: HTMLElement, title: string) => Promise<void>;
}> = ({ reportId, reportName, buildHtmlMethod }) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="export-container-report-page bg-background"
      ref={ref}
      style={{
        width: '820px',
        minWidth: '820px',
        maxWidth: '820px',
        height: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1
      }}>
      <ReportPageController
        reportId={reportId}
        readOnly={true}
        mode="export"
        onReady={() => {
          setTimeout(async () => {
            const immiateChild = ref.current?.children[0] as HTMLElement;
            if (immiateChild) {
              await buildHtmlMethod(immiateChild, reportName || '');
            }
          }, 150);
        }}
      />
    </div>
  );
};

export const useReportPageExport = ({
  reportId,
  reportName
}: {
  reportId: string;
  reportName: string;
}) => {
  const [isExportingReport, setIsExportingReport] = useState(false);

  const exportReportAsPDF = useMemoizedFn(async () => {
    setIsExportingReport(true);
    return;
  });

  const cancelExport = useMemoizedFn(() => {
    setIsExportingReport(false);
  });

  const buildHtmlMethod = useMemoizedFn(async (node: HTMLElement, title: string) => {
    try {
      await timeout(150); //wait for chart nodes to be rendered
      const result = await buildExportHtml({ root: node, title });
      printHTMLPage({ html: result, filename: title, closeOnPrint: false });
    } finally {
      //  setIsExportingReport(false);
    }
  });

  const ExportContainer = isExportingReport ? (
    <ExportContainerComponent
      reportId={reportId}
      reportName={reportName}
      buildHtmlMethod={buildHtmlMethod}
    />
  ) : null;

  return {
    exportReportAsPDF,
    cancelExport,
    ExportContainer
  };
};

const buildExportHtml = async (options?: {
  title?: string;
  root: HTMLElement;
}): Promise<string> => {
  // Resolve the document title with a sensible default
  const documentTitle = options?.title || 'Buster Report';
  // Prefer using the live editor DOM to inline computed styles

  let contentHtml = '';
  const root = options?.root;

  if (root) {
    // Clone live DOM subtree and inline computed styles
    const clonedRoot = root.cloneNode(true) as HTMLElement;

    // Snapshot metric canvases from the LIVE DOM and replace in the clone
    const liveMetricCanvases = Array.from(
      root.querySelectorAll('[data-export-metric] canvas')
    ) as HTMLCanvasElement[];
    const cloneMetricCanvases = Array.from(
      clonedRoot.querySelectorAll('[data-export-metric] canvas')
    ) as HTMLCanvasElement[];

    for (let i = 0; i < Math.min(liveMetricCanvases.length, cloneMetricCanvases.length); i++) {
      const liveCanvas = liveMetricCanvases[i];
      const cloneCanvas = cloneMetricCanvases[i];
      try {
        // Use the raw canvas data to preserve exact rendering
        const dataUrl = liveCanvas.toDataURL('image/png');
        if (dataUrl) {
          const img = document.createElement('img');
          img.src = dataUrl;
          img.alt = 'Metric';
          const computed = window.getComputedStyle(liveCanvas);
          const width = computed.getPropertyValue('width');
          const height = computed.getPropertyValue('height');
          if (width) (img.style as CSSStyleDeclaration).width = width;
          if (height) (img.style as CSSStyleDeclaration).height = height;
          (img.style as CSSStyleDeclaration).display = 'block';
          cloneCanvas.replaceWith(img);
        }
      } catch (e) {
        // If canvas is tainted or fails, leave the canvas as-is
        console.error('Failed to snapshot metric canvas for HTML export', e);
      }
    }

    // Inline computed styles by pairing original and clone nodes in order
    const originals = [root, ...Array.from(root.querySelectorAll('*'))];
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

    // Ensure the cloned root has no padding and full width
    const existingStyle = clonedRoot.getAttribute('style') || '';
    clonedRoot.setAttribute(
      'style',
      `${existingStyle}; width: 100%; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: visible;`.trim()
    );

    // Wrap content with a fixed width, centered container for consistency
    const wrapper = document.createElement('div');
    wrapper.setAttribute(
      'style',
      [
        'width: 816px',
        'max-width: 816px',
        'min-width: 816px',
        'margin: 24px auto',
        'background: #ffffff',
        'padding: 40px',
        'box-sizing: border-box'
      ].join('; ')
    );
    wrapper.appendChild(clonedRoot);
    contentHtml = wrapper.outerHTML;
  } else {
    throw new Error('No live root found');
  }

  // Build a minimal HTML document without external CSS
  const html = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="color-scheme" content="light dark" />
          <title>${documentTitle}</title>
          <style>
            body { margin: 0; background: #f5f5f5; }
            @media print {
              body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>`;

  return html;
};
