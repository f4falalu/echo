'use client';

import * as React from 'react';
import { NodeTypeIcons } from '../config/icons';
import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';

import { AIToolbarButton } from './AIToolbarButton';
import { CommentToolbarButton } from './CommandToolbarButton';
import { InlineEquationToolbarButton } from './EquationToolbarButton';
import { LinkToolbarButton } from './LinkToolbarButton';
import { MarkToolbarButton } from './MarktoolbarButton';
import { MoreToolbarButton } from './MoreToolbarButton';
import { SuggestionToolbarButton } from './SuggestionToolbarButton';
import { ToolbarGroup } from '@/components/ui/toolbar/Toolbar';
import { TurnIntoToolbarButton } from './TurnIntoToolbarButton';

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <>
      {!readOnly && (
        <>
          {/* <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              {AIIcon}
              Ask AI
            </AIToolbarButton>
          </ToolbarGroup> */}

          <ToolbarGroup>
            <TurnIntoToolbarButton />

            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
              <NodeTypeIcons.bold />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
              <NodeTypeIcons.italic />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.underline} tooltip="Underline (⌘+U)">
              <NodeTypeIcons.underline />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip="Strikethrough (⌘+⇧+M)">
              <NodeTypeIcons.strikethrough />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
              <NodeTypeIcons.code />
            </MarkToolbarButton>

            <InlineEquationToolbarButton />

            <LinkToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <ToolbarGroup>
        {/* <CommentToolbarButton />
        <SuggestionToolbarButton /> */}

        {!readOnly && <MoreToolbarButton />}
      </ToolbarGroup>
    </>
  );
}
