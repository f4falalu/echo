import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';
import { ToolbarGroup } from '@/components/ui/toolbar/Toolbar';
import { NodeTypeIcons } from '../config/icons';
import { createLabel } from '../config/labels';
import { LinkToolbarButton } from './LinkToolbarButton';
import { MarkToolbarButton } from './MarktoolbarButton';
import { MoreToolbarButton } from './MoreToolbarButton';
import { TurnIntoToolbarButton } from './TurnIntoToolbarButton';

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <>
      {!readOnly && (
        <ToolbarGroup>
          <TurnIntoToolbarButton />

          <MarkToolbarButton nodeType={KEYS.bold} tooltip={createLabel('bold')}>
            <NodeTypeIcons.bold />
          </MarkToolbarButton>

          <MarkToolbarButton nodeType={KEYS.italic} tooltip={createLabel('italic')}>
            <NodeTypeIcons.italic />
          </MarkToolbarButton>

          <MarkToolbarButton nodeType={KEYS.underline} tooltip={createLabel('underline')}>
            <NodeTypeIcons.underline />
          </MarkToolbarButton>

          <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip={createLabel('strikethrough')}>
            <NodeTypeIcons.strikethrough />
          </MarkToolbarButton>

          <MarkToolbarButton nodeType={KEYS.code} tooltip={createLabel('code')}>
            <NodeTypeIcons.code />
          </MarkToolbarButton>

          {/* <InlineEquationToolbarButton /> */}

          <LinkToolbarButton />
        </ToolbarGroup>
      )}

      <ToolbarGroup>
        {/* <CommentToolbarButton />
        <SuggestionToolbarButton /> */}

        {!readOnly && <MoreToolbarButton />}
      </ToolbarGroup>
    </>
  );
}
