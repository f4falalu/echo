/** biome-ignore-all lint/a11y/useHeadingContent: not applicable */

import { KEYS } from 'platejs';
import type { PlateEditor } from 'platejs/react';
import type * as React from 'react';
import { Minus } from '@/components/ui/icons';
import {
  ACTION_THREE_COLUMNS,
  ACTION_TWO_COLUMNS,
  insertBlock,
  insertInlineElement,
} from '../elements/transforms';
import { NodeTypeIcons } from './icons';
import { CUSTOM_KEYS } from './keys';
import { MenuGroupLabels, NodeTypeLabels } from './labels';

// Shared types for menu items
export interface MenuItem {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  className?: string;
  focusEditor?: boolean;
  keywords?: readonly string[];
  label?: string;
  description?: string;
}

export interface MenuGroup {
  group: string;
  items: MenuItem[];
}

// Shared menu groups used by both SlashNode and InsertToolbarButton
export const menuGroups: MenuGroup[] = [
  // {
  //   group: 'AI',
  //   items: [
  //     {
  //       focusEditor: false,
  //       icon: <NodeTypeIcons.sparkleAI />,
  //       label: NodeTypeLabels.aiChat.label,
  //       keywords: NodeTypeLabels.aiChat.keywords,
  //       value: 'AI',
  //       onSelect: (editor) => {
  //         editor.getApi(AIChatPlugin).aiChat.show();
  //       }
  //     }
  //   ]
  // },
  {
    group: MenuGroupLabels.basicBlocks,
    items: [
      {
        icon: <NodeTypeIcons.paragraph />,
        keywords: NodeTypeLabels.paragraph.keywords,
        label: NodeTypeLabels.paragraph.label,
        value: KEYS.p,
      },
      {
        icon: <NodeTypeIcons.h1 />,
        keywords: NodeTypeLabels.h1.keywords,
        label: NodeTypeLabels.h1.label,
        value: 'h1',
      },
      {
        icon: <NodeTypeIcons.h2 />,
        keywords: NodeTypeLabels.h2.keywords,
        label: NodeTypeLabels.h2.label,
        value: 'h2',
      },
      {
        icon: <NodeTypeIcons.h3 />,
        keywords: NodeTypeLabels.h3.keywords,
        label: NodeTypeLabels.h3.label,
        value: 'h3',
      },
      // {
      //   icon: <NodeTypeIcons.table />,
      //   keywords: NodeTypeLabels.table.keywords,
      //   label: NodeTypeLabels.table.label,
      //   value: KEYS.table,
      // },
      {
        icon: <NodeTypeIcons.code />,
        keywords: NodeTypeLabels.codeBlock.keywords,
        label: NodeTypeLabels.codeBlock.label,
        value: KEYS.codeBlock,
      },
      {
        icon: <NodeTypeIcons.quote />,
        keywords: NodeTypeLabels.blockquote.keywords,
        label: NodeTypeLabels.blockquote.label,
        value: KEYS.blockquote,
      },
      {
        icon: <Minus />,
        label: NodeTypeLabels.divider.label,
        value: KEYS.hr,
      },
      {
        description: 'Insert a highlighted block.',
        icon: <NodeTypeIcons.callout />,
        keywords: NodeTypeLabels.callout.keywords,
        label: NodeTypeLabels.callout.label,
        value: KEYS.callout,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: 'Charts',
    items: [
      {
        icon: <NodeTypeIcons.metricAdd />,
        keywords: NodeTypeLabels.metric.keywords,
        label: NodeTypeLabels.metric.label,
        value: CUSTOM_KEYS.metric,
        onSelect: (editor) => {
          insertBlock(editor, CUSTOM_KEYS.metric);
        },
      },
    ],
  },
  {
    group: MenuGroupLabels.lists,
    items: [
      {
        icon: <NodeTypeIcons.bulletedList />,
        keywords: NodeTypeLabels.bulletedList.keywords,
        label: NodeTypeLabels.bulletedList.label,
        value: KEYS.ul,
      },
      {
        icon: <NodeTypeIcons.numberedList />,
        keywords: NodeTypeLabels.numberedList.keywords,
        label: NodeTypeLabels.numberedList.label,
        value: KEYS.ol,
      },
      {
        icon: <NodeTypeIcons.todoList />,
        keywords: NodeTypeLabels.todoList.keywords,
        label: NodeTypeLabels.todoList.label,
        value: KEYS.listTodo,
      },
      {
        icon: <NodeTypeIcons.toggle />,
        keywords: NodeTypeLabels.toggleList.keywords,
        label: NodeTypeLabels.toggleList.label,
        value: KEYS.toggle,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  // {
  //   group: MenuGroupLabels.media,
  //   items: [
  //     {
  //       icon: <NodeTypeIcons.image />,
  //       keywords: NodeTypeLabels.image?.keywords,
  //       label: NodeTypeLabels.image.label,
  //       value: KEYS.img
  //     },
  //     {
  //       icon: <NodeTypeIcons.embed />,
  //       keywords: NodeTypeLabels.embed?.keywords,
  //       label: NodeTypeLabels.embed.label,
  //       value: KEYS.mediaEmbed
  //     }
  //   ].map((item) => ({
  //     ...item,
  //     onSelect: (editor, value) => {
  //       insertBlock(editor, value);
  //     }
  //   }))
  // },
  {
    group: MenuGroupLabels.advancedBlocks,
    items: [
      {
        icon: <NodeTypeIcons.tableOfContents />,
        keywords: NodeTypeLabels.tableOfContents.keywords,
        label: NodeTypeLabels.tableOfContents.label,
        value: KEYS.toc,
      },
      {
        icon: <NodeTypeIcons.columnsTwo />,
        keywords: NodeTypeLabels.columnsTwo.keywords,
        label: NodeTypeLabels.columnsTwo.label,
        value: ACTION_TWO_COLUMNS,
      },
      {
        icon: <NodeTypeIcons.columnsThree />,
        keywords: NodeTypeLabels.columnsThree.keywords,
        label: NodeTypeLabels.columnsThree.label,
        value: ACTION_THREE_COLUMNS,
      },
      // {
      //   focusEditor: false,
      //   icon: <NodeTypeIcons.equation />,
      //   keywords: NodeTypeLabels.equation.keywords,
      //   label: NodeTypeLabels.equation.label,
      //   value: KEYS.equation
      // }
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: MenuGroupLabels.inline,
    items: [
      // {
      //   icon: <NodeTypeIcons.link />,
      //   keywords: NodeTypeLabels.link?.keywords,
      //   label: NodeTypeLabels.link.label,
      //   value: KEYS.link
      // },
      {
        focusEditor: true,
        icon: <NodeTypeIcons.calendar />,
        keywords: NodeTypeLabels.date.keywords,
        label: NodeTypeLabels.date.label,
        value: KEYS.date,
      },
      // {
      //   focusEditor: false,
      //   icon: <NodeTypeIcons.equation />,
      //   keywords: NodeTypeLabels.inlineEquation.keywords,
      //   label: NodeTypeLabels.inlineEquation.label,
      //   value: KEYS.inlineEquation
      // }
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value);
      },
    })),
  },
];

// Helper function to get groups for slash command and insert button
export function getSlashGroups(): MenuGroup[] {
  return menuGroups;
}

// Helper function to get groups for insert button (same as slash groups)
export function getInsertGroups(): MenuGroup[] {
  return menuGroups;
}
