import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { useState } from 'react';
import type { MentionTriggerItem } from './MentionInput.types';

export type MentionPillAttributes = Pick<
  MentionTriggerItem,
  'label' | 'value' | 'doNotAddPipeOnSelect'
>;

export const MentionPill = ({ node, extension }: ReactNodeViewProps<MentionTriggerItem>) => {
  const attrs = node.attrs as MentionPillAttributes;
  const [showPopover, setShowPopover] = useState(false);

  // Access the mention items from extension storage
  const mentionItems = extension.storage.mentionItems as MentionTriggerItem[];

  // Find the matching item with popover content
  const matchingItem = mentionItems.find((item) => item.value === attrs.value);
  const popoverContent = matchingItem?.popoverContent?.({
    value: attrs.value,
    label: attrs.label,
  });

  return (
    <NodeViewWrapper as={node.attrs.as ?? 'span'}>
      <span
        className="bg-item-select border rounded p-0.5 w-fit cursor-pointer hover:bg-opacity-80"
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
      >
        {node.attrs.label}
      </span>

      {/* Render popover if content exists */}
      {showPopover && popoverContent && (
        <div className="absolute z-50 bg-white border rounded shadow-lg p-2 mt-1">
          {popoverContent}
        </div>
      )}
    </NodeViewWrapper>
  );
};
