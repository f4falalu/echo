'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { useEditorRef } from 'platejs/react';
import { createLabel, NodeTypeLabels } from '../config/labels';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';
import { useExportReport } from '../hooks/useExportReport';

export function ExportToolbarButton({ children, ...props }: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const { exportToHtml, exportToPdf, exportToImage, exportToMarkdown } = useExportReport(editor);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip={createLabel('export')} isDropdown>
          {children}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={exportToHtml}>
            {NodeTypeLabels.exportAsHtml.label}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToPdf}>
            {NodeTypeLabels.exportAsPdf.label}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToImage}>
            {NodeTypeLabels.exportAsImage.label}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToMarkdown}>
            {NodeTypeLabels.exportAsMarkdown.label}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
