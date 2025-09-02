import type { PlateEditor } from 'platejs/react';

// Build a complete HTML document string for export, inlining
// computed CSS styles so no external CSS is required. Additionally,
// snapshot <canvas> elements inside metrics to <img> tags to avoid
// blank canvases in the exported HTML.
// Options for building the export HTML document
type BuildExportHtmlOptions = {
  // Optional document title to embed in the HTML head
  title?: string;
};

export const buildExportHtml = async (
  _editor: PlateEditor,
  _options?: BuildExportHtmlOptions
): Promise<string> => {
  alert('TODO');

  return '';
};

export default buildExportHtml;
