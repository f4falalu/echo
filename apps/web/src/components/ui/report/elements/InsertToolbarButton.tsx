'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { Minus, Plus } from '@/components/ui/icons';
import { NodeTypeIcons } from '../config/icons';
import { createLabel, NodeTypeLabels, MenuGroupLabels } from '../config/labels';
import { KEYS } from 'platejs';
import { type PlateEditor, useEditorRef } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { insertBlock, insertInlineElement } from './transforms';

import { ToolbarButton, ToolbarMenuGroup } from '@/components/ui/toolbar/Toolbar';

type Group = {
  group: string;
  items: Item[];
};

interface Item {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  focusEditor?: boolean;
  label?: string;
}

const groups: Group[] = [
  {
    group: MenuGroupLabels.basicBlocks,
    items: [
      {
        icon: <NodeTypeIcons.paragraph />,
        label: NodeTypeLabels.paragraph.label,
        value: KEYS.p
      },
      {
        icon: <NodeTypeIcons.h1 />,
        label: NodeTypeLabels.h1.label,
        value: 'h1'
      },
      {
        icon: <NodeTypeIcons.h2 />,
        label: NodeTypeLabels.h2.label,
        value: 'h2'
      },
      {
        icon: <NodeTypeIcons.h3 />,
        label: NodeTypeLabels.h3.label,
        value: 'h3'
      },
      {
        icon: <NodeTypeIcons.table />,
        label: NodeTypeLabels.table.label,
        value: KEYS.table
      },
      {
        icon: <NodeTypeIcons.code />,
        label: NodeTypeLabels.codeBlock.label,
        value: KEYS.codeBlock
      },
      {
        icon: <NodeTypeIcons.quote />,
        label: NodeTypeLabels.blockquote.label,
        value: KEYS.blockquote
      },
      {
        icon: <Minus />,
        label: NodeTypeLabels.divider.label,
        value: KEYS.hr
      },
      {
        icon: <NodeTypeIcons.callout />,
        label: NodeTypeLabels.callout.label,
        value: KEYS.callout
      }
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      }
    }))
  },
  {
    group: MenuGroupLabels.lists,
    items: [
      {
        icon: <NodeTypeIcons.bulletedList />,
        label: NodeTypeLabels.bulletedList.label,
        value: KEYS.ul
      },
      {
        icon: <NodeTypeIcons.numberedList />,
        label: NodeTypeLabels.numberedList.label,
        value: KEYS.ol
      },
      {
        icon: <NodeTypeIcons.shape />,
        label: NodeTypeLabels.todoList.label,
        value: KEYS.listTodo
      },
      {
        icon: <NodeTypeIcons.toggle />,
        label: NodeTypeLabels.toggleList.label,
        value: KEYS.toggle
      }
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      }
    }))
  },
  {
    group: MenuGroupLabels.media,
    items: [
      {
        icon: <NodeTypeIcons.image />,
        label: NodeTypeLabels.image.label,
        value: KEYS.img
      },
      {
        icon: <NodeTypeIcons.embed />,
        label: NodeTypeLabels.embed.label,
        value: KEYS.mediaEmbed
      }
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      }
    }))
  },
  {
    group: MenuGroupLabels.advancedBlocks,
    items: [
      {
        icon: <NodeTypeIcons.tableOfContents />,
        label: NodeTypeLabels.tableOfContents.label,
        value: KEYS.toc
      },
      {
        icon: <NodeTypeIcons.columnsThree />,
        label: NodeTypeLabels.columnsThree.label,
        value: 'action_three_columns'
      },
      {
        focusEditor: false,
        icon: <NodeTypeIcons.equation />,
        label: NodeTypeLabels.equation.label,
        value: KEYS.equation
      }
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      }
    }))
  },
  {
    group: MenuGroupLabels.inline,
    items: [
      {
        icon: <NodeTypeIcons.link />,
        label: NodeTypeLabels.link.label,
        value: KEYS.link
      },
      {
        focusEditor: true,
        icon: <NodeTypeIcons.calendar />,
        label: NodeTypeLabels.date.label,
        value: KEYS.date
      },
      {
        focusEditor: false,
        icon: <NodeTypeIcons.equation />,
        label: NodeTypeLabels.inlineEquation.label,
        value: KEYS.inlineEquation
      }
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value);
      }
    }))
  }
];

export function InsertToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger>
        <ToolbarButton pressed={open} tooltip={createLabel('insert')} isDropdown>
          <Plus />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="flex max-h-[500px] min-w-0 flex-col overflow-y-auto"
        align="start">
        {groups.map(({ group, items: nestedItems }) => (
          <ToolbarMenuGroup key={group} label={group}>
            {nestedItems.map(({ icon, label, value, onSelect }) => (
              <DropdownMenuItem
                key={value}
                className="min-w-[180px]"
                onSelect={() => {
                  onSelect(editor, value);
                  editor.tf.focus();
                }}>
                {icon}
                {label}
              </DropdownMenuItem>
            ))}
          </ToolbarMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
