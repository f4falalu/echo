import type { PlateEditor } from 'platejs/react';
import { NodeTypeLabels } from '../config/labels';
import { MarkdownPlugin } from '@platejs/markdown';
import { downloadFile } from './downloadFile';

type Notifier = (message: string) => void;

export const exportToMarkdown = async (
  editor: PlateEditor,
  openInfoMessage: Notifier,
  openErrorMessage: Notifier
) => {
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

export default exportToMarkdown;


