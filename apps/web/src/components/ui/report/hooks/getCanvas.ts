import type { PlateEditor } from 'platejs/react';

// Render the current editor content to a canvas for image export.
export const getCanvas = async (editor: PlateEditor) => {
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

export default getCanvas;
