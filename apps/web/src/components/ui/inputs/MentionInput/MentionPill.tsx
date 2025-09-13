import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import type { MentionTriggerItem } from './MentionInput.types';

export const MentionPill = ({ node }: ReactNodeViewProps<MentionTriggerItem>) => {
  console.log(node);

  return (
    <NodeViewWrapper as={node.attrs.as ?? 'span'}>
      <span className="bg-item-select border rounded p-0.5 w-fit">
        <label>{node.attrs.label}</label>
      </span>
    </NodeViewWrapper>
  );
};
