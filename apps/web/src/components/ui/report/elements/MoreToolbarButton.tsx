import { BlockSelectionPlugin } from '@platejs/selection/react';
import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import { KEYS, PathApi } from 'platejs';
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
        const block = editor.api.block();
        if (!block) return;
        editor.tf.duplicateNodes({
          nodes: [block],
        });
        const path = PathApi.next(block[1]);
        setTimeout(() => {
          editor.tf.select(path);
          editor.tf.focus();
        }, 0);
      },
    },
    {
      value: 'delete',
      label: NodeTypeLabels.delete.label,
      icon: <NodeTypeIcons.trash />,
      onClick: () => {
        const block = editor.api.block();
        if (!block) return;
        editor.tf.removeNodes({
          at: block[1],
        });
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
