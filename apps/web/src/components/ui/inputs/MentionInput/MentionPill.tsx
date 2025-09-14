import { type Editor, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import type React from 'react';
import { Popover } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { MentionTriggerItem } from './MentionInput.types';

export type MentionPillAttributes<T = string> = Pick<
  MentionTriggerItem<T>,
  'label' | 'value' | 'doNotAddPipeOnSelect'
> & { trigger: string };

export const MentionPill = <T extends string>({
  node,
  editor,
}: ReactNodeViewProps<MentionTriggerItem<T>>) => {
  const { trigger, label, value } = node.attrs as MentionPillAttributes;
  const pillStyling = editor.storage.mention.pillStylingByTrigger.get(trigger);
  const pillClassName = pillStyling?.className;
  const pillStyle = pillStyling?.style;

  return (
    <NodeViewWrapper as={node.attrs.as ?? 'span'}>
      <PopoverWrapper trigger={trigger} editor={editor} value={value}>
        <span
          className={cn(
            'text-sm px-1.5 py-0.5',
            'bg-item-select hover:bg-item-hover-active hover:shadow transition-all border rounded w-fit',
            'cursor-pointer',
            pillClassName
          )}
          style={pillStyle}
        >
          {label}
        </span>
      </PopoverWrapper>
    </NodeViewWrapper>
  );
};

const PopoverWrapper = <T extends string>({
  children,
  trigger,
  editor,
  value,
}: {
  children: React.ReactNode;
  trigger: string;
  value: T;
  editor: Editor;
}) => {
  try {
    const PopoverContent = editor.commands.getPopoverByTrigger(trigger);
    if (!PopoverContent) return children;

    return (
      <Popover trigger="click" content={<PopoverContent value={value} />}>
        {children}
      </Popover>
    );
  } catch (error) {
    console.error(error);
    return children;
  }
};
