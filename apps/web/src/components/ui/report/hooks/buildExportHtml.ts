import { EditorStatic } from '../elements/EditorStatic';
import type { PlateEditor } from 'platejs/react';
import { createSlateEditor, serializeHtml } from 'platejs';

// Build a complete HTML document string for export, inlining
// computed CSS styles so no external CSS is required. Additionally,
// snapshot <canvas> elements inside metrics to <img> tags to avoid
// blank canvases in the exported HTML.
export const buildExportHtml = async (editor: PlateEditor): Promise<string> => {
  // Prefer using the live editor DOM to inline computed styles
  const liveRoot = document.querySelector('[contenteditable="true"]') as HTMLElement | null;

  let contentHtml = '';

  if (liveRoot) {
    // Clone live DOM subtree and inline computed styles
    const clonedRoot = liveRoot.cloneNode(true) as HTMLElement;

    // Snapshot metric canvases from the LIVE DOM and replace in the clone
    const liveMetricCanvases = Array.from(
      liveRoot.querySelectorAll('[data-export-metric] canvas')
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
    // Fallback: serialize using static editor and include minimal inline styles
    const BaseEditorKit = await import('../editor-base-kit').then((module) => module.BaseEditorKit);

    const editorStatic = createSlateEditor({
      plugins: BaseEditorKit,
      value: editor.children
    });

    const serializedHtml = await serializeHtml(editorStatic, {
      editorComponent: EditorStatic,
      props: { style: { padding: '0 calc(50% - 350px)', paddingBottom: '' } }
    });

    // Wrap the serialized HTML to match the centered, fixed-width layout
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
    wrapper.innerHTML = serializedHtml;
    contentHtml = wrapper.outerHTML;
  }

  // Build a minimal HTML document without external CSS
  const html = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="color-scheme" content="light dark" />
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

export default buildExportHtml;
