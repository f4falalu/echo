import { BlockSelectionPlugin } from '@platejs/selection/react';
import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import { KEYS } from 'platejs';
import { useEditorRef, useElement } from 'platejs/react';
import * as React from 'react';
import { Button } from '../../buttons';
import { Dropdown, type DropdownDivider, type IDropdownItems } from '../../dropdown';
import { NodeTypeIcons } from '../config/icons';
import { NodeTypeLabels } from '../config/labels';

export function MoreToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const items: IDropdownItems = [
    {
      value: 'duplicate',
      label: NodeTypeLabels.duplicate.label,
      icon: <NodeTypeIcons.duplicate />,
      onClick: () => {
        console.log(
          'duplicate',
          editor.selection,
          editor.api.block(),
          editor.api.blocks({ mode: 'lowest' })
        );
        editor.tf.duplicateNodes({ block: true, select: true });
      },
    },
    {
      value: 'delete',
      label: NodeTypeLabels.delete.label,
      icon: <NodeTypeIcons.trash />,
      onClick: () => {
        console.log('delete');
        editor.tf.removeNodes({ block: true });
      },
    },
    { type: 'divider' as const } satisfies DropdownDivider,
    {
      value: 'keyboard',
      label: NodeTypeLabels.keyboardInput.label,
      icon: <NodeTypeIcons.keyboard />,
      onClick: () => {
        editor.tf.toggleMark(KEYS.kbd);
        editor.tf.collapse({ edge: 'end' });
        editor.tf.focus();
      },
    },
    {
      value: 'superscript',
      label: NodeTypeLabels.superscript.label,
      icon: <NodeTypeIcons.superscript />,
      onClick: () => {
        editor.tf.toggleMark(KEYS.sup);
        editor.tf.focus();
      },
    },
    {
      value: 'subscript',
      label: NodeTypeLabels.subscript.label,
      icon: <NodeTypeIcons.subscript />,
      onClick: () => {
        editor.tf.toggleMark(KEYS.sub);
        editor.tf.focus();
      },
    },
  ];

  return (
    <Dropdown items={items} open={open} onOpenChange={setOpen} modal={false} selectType="none">
      <Button variant={'ghost'} prefix={<NodeTypeIcons.moreHorizontal />} />
    </Dropdown>
  );
}
