import { EditorStatic } from '../elements/EditorStatic';
import type { PlateEditor } from 'platejs/react';
import { createSlateEditor, serializeHtml } from 'platejs';

// Build a complete HTML document string for export, rasterizing
// metric elements (which may contain canvas) into <img> tags AND
// inlining computed CSS styles so no external CSS is required.
export const buildExportHtml = async (editor: PlateEditor): Promise<string> => {
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

export default buildExportHtml;


