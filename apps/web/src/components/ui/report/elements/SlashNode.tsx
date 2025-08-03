'use client';

import * as React from 'react';

import type { PlateEditor, PlateElementProps } from 'platejs/react';

import { AIChatPlugin } from '@platejs/ai/react';
import { type TComboboxInputElement, KEYS } from 'platejs';
import { PlateElement } from 'platejs/react';
import { NodeTypeIcons } from '../config/icons';
import { NodeTypeLabels, MenuGroupLabels } from '../config/labels';

import { insertBlock, insertInlineElement } from './transforms';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem
} from './InlineCombobox';

type Group = {
  group: string;
  items: Item[];
};

interface Item {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  className?: string;
  focusEditor?: boolean;
  keywords?: readonly string[];
  label?: string;
  description?: string;
}

const groups: Group[] = [
  {
    group: 'AI',
    items: [
      {
        focusEditor: false,
        icon: <NodeTypeIcons.sparkleAI />,
        label: NodeTypeLabels.aiChat.label,
        keywords: NodeTypeLabels.aiChat.keywords,
        value: 'AI',
        onSelect: (editor) => {
          editor.getApi(AIChatPlugin).aiChat.show();
        }
      }
    ]
  },
  {
    group: MenuGroupLabels.basicBlocks,
    items: [
      {
        icon: <NodeTypeIcons.paragraph />,
        keywords: NodeTypeLabels.paragraph.keywords,
        label: NodeTypeLabels.paragraph.label,
        value: KEYS.p
      },
      {
        icon: <NodeTypeIcons.h1 />,
        keywords: NodeTypeLabels.h1.keywords,
        label: NodeTypeLabels.h1.label,
        value: KEYS.h1
      },
      {
        icon: <NodeTypeIcons.h2 />,
        keywords: NodeTypeLabels.h2.keywords,
        label: NodeTypeLabels.h2.label,
        value: KEYS.h2
      },
      {
        icon: <NodeTypeIcons.h3 />,
        keywords: NodeTypeLabels.h3.keywords,
        label: NodeTypeLabels.h3.label,
        value: KEYS.h3
      },
      {
        icon: <NodeTypeIcons.bulletedList />,
        keywords: NodeTypeLabels.bulletedList.keywords,
        label: NodeTypeLabels.bulletedList.label,
        value: KEYS.ul
      },
      {
        icon: <NodeTypeIcons.numberedList />,
        keywords: NodeTypeLabels.numberedList.keywords,
        label: NodeTypeLabels.numberedList.label,
        value: KEYS.ol
      },
      {
        icon: <NodeTypeIcons.todoList />,
        keywords: NodeTypeLabels.todoList.keywords,
        label: NodeTypeLabels.todoList.label,
        value: KEYS.listTodo
      },
      {
        icon: <NodeTypeIcons.toggle />,
        keywords: NodeTypeLabels.toggleList.keywords,
        label: NodeTypeLabels.toggleList.label,
        value: KEYS.toggle
      },
      {
        icon: <NodeTypeIcons.code />,
        keywords: NodeTypeLabels.codeBlock.keywords,
        label: NodeTypeLabels.codeBlock.label,
        value: KEYS.codeBlock
      },
      {
        icon: <NodeTypeIcons.table />,
        keywords: NodeTypeLabels.table.keywords,
        label: NodeTypeLabels.table.label,
        value: KEYS.table
      },
      {
        icon: <NodeTypeIcons.quote />,
        keywords: NodeTypeLabels.blockquote.keywords,
        label: NodeTypeLabels.blockquote.label,
        value: KEYS.blockquote
      },
      {
        description: 'Insert a highlighted block.',
        icon: <NodeTypeIcons.callout />,
        keywords: NodeTypeLabels.callout.keywords,
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
    group: MenuGroupLabels.advancedBlocks,
    items: [
      {
        icon: <NodeTypeIcons.searchContent />,
        keywords: NodeTypeLabels.tableOfContents.keywords,
        label: NodeTypeLabels.tableOfContents.label,
        value: KEYS.toc
      },
      {
        icon: <NodeTypeIcons.columnsThree />,
        keywords: NodeTypeLabels.columnsThree.keywords,
        label: NodeTypeLabels.columnsThree.label,
        value: 'action_three_columns'
      },
      {
        focusEditor: false,
        icon: <NodeTypeIcons.equation />,
        keywords: NodeTypeLabels.equation.keywords,
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
        focusEditor: true,
        icon: <NodeTypeIcons.calendar />,
        keywords: NodeTypeLabels.date.keywords,
        label: NodeTypeLabels.date.label,
        value: KEYS.date
      },
      {
        focusEditor: false,
        icon: <NodeTypeIcons.equation />,
        keywords: NodeTypeLabels.inlineEquation.keywords,
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

export function SlashInputElement(props: PlateElementProps<TComboboxInputElement>) {
  const { editor, element } = props;

  return (
    <PlateElement {...props} as="span" data-slate-value={element.value}>
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(({ focusEditor, icon, keywords, label, value, onSelect }) => (
                <InlineComboboxItem
                  key={value}
                  value={value}
                  onClick={() => onSelect(editor, value)}
                  label={label}
                  focusEditor={focusEditor}
                  group={group}
                  keywords={keywords ? [...keywords] : undefined}>
                  <div className="text-muted-foreground mr-2">{icon}</div>
                  {label ?? value}
                </InlineComboboxItem>
              ))}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
