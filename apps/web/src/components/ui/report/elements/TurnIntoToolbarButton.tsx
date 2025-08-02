'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import type { TElement } from 'platejs';

import { DropdownMenuItemIndicator } from '@radix-ui/react-dropdown-menu';
import { Check } from '@/components/ui/icons';
import { NodeTypeIcons } from '../config/icons';
import { KEYS } from 'platejs';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { getBlockType, setBlockType } from './transforms';

import { ToolbarButton, ToolbarMenuGroup } from '@/components/ui/toolbar/Toolbar';
import { THEME_RESET_STYLE } from '@/styles/theme-reset';

const turnIntoItems = [
  {
    icon: <NodeTypeIcons.paragraph />,
    keywords: ['paragraph'],
    label: 'Text',
    value: KEYS.p
  },
  {
    icon: <NodeTypeIcons.h1 />,
    keywords: ['title', 'h1'],
    label: 'Heading 1',
    value: 'h1'
  },
  {
    icon: <NodeTypeIcons.h2 />,
    keywords: ['subtitle', 'h2'],
    label: 'Heading 2',
    value: 'h2'
  },
  {
    icon: <NodeTypeIcons.h3 />,
    keywords: ['subtitle', 'h3'],
    label: 'Heading 3',
    value: 'h3'
  },
  {
    icon: <NodeTypeIcons.h4 />,
    keywords: ['subtitle', 'h4'],
    label: 'Heading 4',
    value: 'h4'
  },
  {
    icon: <NodeTypeIcons.h5 />,
    keywords: ['subtitle', 'h5'],
    label: 'Heading 5',
    value: 'h5'
  },
  {
    icon: <NodeTypeIcons.h6 />,
    keywords: ['subtitle', 'h6'],
    label: 'Heading 6',
    value: 'h6'
  },
  {
    icon: <NodeTypeIcons.bulletedList />,
    keywords: ['unordered', 'ul', '-'],
    label: 'Bulleted list',
    value: KEYS.ul
  },
  {
    icon: <NodeTypeIcons.numberedList />,
    keywords: ['ordered', 'ol', '1'],
    label: 'Numbered list',
    value: KEYS.ol
  },
  {
    icon: <NodeTypeIcons.checkList />,
    keywords: ['checklist', 'task', 'checkbox', '[]'],
    label: 'To-do list',
    value: KEYS.listTodo
  },
  {
    icon: <NodeTypeIcons.toggle />,
    keywords: ['collapsible', 'expandable'],
    label: 'Toggle list',
    value: KEYS.toggle
  },
  {
    icon: <NodeTypeIcons.codeBlock />,
    keywords: ['```'],
    label: 'Code',
    value: KEYS.codeBlock
  },
  {
    icon: <NodeTypeIcons.quote />,
    keywords: ['citation', 'blockquote', '>'],
    label: 'Quote',
    value: KEYS.blockquote
  },
  {
    icon: <NodeTypeIcons.columnsThree />,
    label: '3 columns',
    value: 'action_three_columns'
  }
];

export function TurnIntoToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement)
  });
  const selectedItem = React.useMemo(
    () => turnIntoItems.find((item) => item.value === (value ?? KEYS.p)) ?? turnIntoItems[0],
    [value]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger>
        <ToolbarButton className="min-w-[125px]" pressed={open} tooltip="Turn into" isDropdown>
          {selectedItem.label}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar min-w-0"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
        align="start">
        <ToolbarMenuGroup
          value={value}
          onValueChange={(type) => {
            setBlockType(editor, type);
          }}
          label="Turn into">
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="min-w-[180px] pl-2 *:first:[span]:hidden"
              value={itemValue}>
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <Check />
                </DropdownMenuItemIndicator>
              </span>
              {icon}
              {label}
            </DropdownMenuRadioItem>
          ))}
        </ToolbarMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
