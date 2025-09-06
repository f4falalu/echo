import { insertInlineEquation } from '@platejs/math';
import { useEditorRef } from 'platejs/react';
import type * as React from 'react';
import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';
import { NodeTypeIcons } from '../config/icons';
import { createLabel } from '../config/labels';

export function InlineEquationToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        insertInlineEquation(editor);
      }}
      tooltip={createLabel('equation')}
    >
      <NodeTypeIcons.equation />
    </ToolbarButton>
  );
}
