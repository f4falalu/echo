'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { MarkdownPlugin } from '@platejs/markdown';
import { ArrowDownFromLine } from '../../icons';
import { createSlateEditor, serializeHtml } from 'platejs';
import { useEditorRef } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { EditorStatic } from './EditorStatic';
import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';
import { useBusterNotifications } from '@/context/BusterNotifications';

const siteUrl = 'https://platejs.org';

export function ExportToolbarButton({ children, ...props }: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const { openErrorMessage, openInfoMessage } = useBusterNotifications();

  const getCanvas = async () => {
    const { default: html2canvas } = await import('html2canvas-pro');

    const style = document.createElement('style');
    document.head.append(style);

    const canvas = await html2canvas(editor.api.toDOMNode(editor)!, {
      onclone: (document: Document) => {
        const editorElement = document.querySelector('[contenteditable="true"]');
        if (editorElement) {
          Array.from(editorElement.querySelectorAll('*')).forEach((element) => {
            const existingStyle = element.getAttribute('style') || '';
            element.setAttribute(
              'style',
              `${existingStyle}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important`
            );
          });
        }
      }
    });
    style.remove();

    return canvas;
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

  const exportToPdf = async () => {
    try {
      const canvas = await getCanvas();
      const PDFLib = await import('pdf-lib');
      const pdfDoc = await PDFLib.PDFDocument.create();

      // Standard A4 dimensions in points (595 x 842)
      const standardWidth = 595;
      const standardHeight = 842;

      // Calculate scaling to fit content within standard width with margins
      const margin = 40; // 40 points margin on each side
      const availableWidth = standardWidth - margin * 2;
      const scaleFactor = Math.min(availableWidth / canvas.width, 1); // Don't scale up, only down

      const scaledWidth = canvas.width * scaleFactor;
      const scaledHeight = canvas.height * scaleFactor;

      // Calculate required page height based on scaled content
      const requiredHeight = Math.max(standardHeight, scaledHeight + margin * 2);

      const page = pdfDoc.addPage([standardWidth, requiredHeight]);
      const imageEmbed = await pdfDoc.embedPng(canvas.toDataURL('PNG'));

      // Center the content horizontally within the standard width
      const xPosition = (standardWidth - scaledWidth) / 2;

      page.drawImage(imageEmbed, {
        height: scaledHeight,
        width: scaledWidth,
        x: xPosition,
        y: requiredHeight - scaledHeight - margin // Position from top with margin
      });

      const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: true });

      await downloadFile(pdfBase64, 'plate.pdf');
      openInfoMessage('PDF exported successfully');
    } catch (error) {
      openErrorMessage('Failed to export PDF');
    }
  };

  const exportToImage = async () => {
    try {
      const canvas = await getCanvas();
      await downloadFile(canvas.toDataURL('image/png'), 'plate.png');
      openInfoMessage('Image exported successfully');
    } catch (error) {
      openErrorMessage('Failed to export image');
    }
  };

  const exportToHtml = async () => {
    try {
      const BaseEditorKit = await import('../editor-base-kit').then(
        (module) => module.BaseEditorKit
      );

      const editorStatic = createSlateEditor({
        plugins: BaseEditorKit,
        value: editor.children
      });

      const editorHtml = await serializeHtml(editorStatic, {
        editorComponent: EditorStatic,
        props: { style: { padding: '0 calc(50% - 350px)', paddingBottom: '' } }
      });

      const tailwindCss = `<link rel="stylesheet" href="${siteUrl}/tailwind.css">`;
      const katexCss = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.18/dist/katex.css" integrity="sha384-9PvLvaiSKCPkFKB1ZsEoTjgnJn+O3KvEwtsz37/XrkYft3DTk2gHdYvd9oWgW3tV" crossorigin="anonymous">`;

      const html = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="color-scheme" content="light dark" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400..700&display=swap"
            rel="stylesheet"
          />
          ${tailwindCss}
          ${katexCss}
          <style>
            :root {
              --font-sans: 'Inter', 'Inter Fallback';
              --font-mono: 'JetBrains Mono', 'JetBrains Mono Fallback';
            }
          </style>
        </head>
        <body>
          ${editorHtml}
        </body>
      </html>`;

      const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

      await downloadFile(url, 'plate.html');
      openInfoMessage('HTML exported successfully');
    } catch (error) {
      openErrorMessage('Failed to export HTML');
    }
  };

  const exportToMarkdown = async () => {
    try {
      const md = editor.getApi(MarkdownPlugin).markdown.serialize();
      const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(md)}`;
      await downloadFile(url, 'plate.md');
      openInfoMessage('Markdown exported successfully');
    } catch (error) {
      openErrorMessage('Failed to export Markdown');
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <div>
          <ToolbarButton pressed={open} tooltip="Export" isDropdown>
            {children}
          </ToolbarButton>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="swagger" align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={exportToHtml}>Export as HTML</DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToPdf}>Export as PDF</DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToImage}>Export as Image</DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToMarkdown}>Export as Markdown</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
