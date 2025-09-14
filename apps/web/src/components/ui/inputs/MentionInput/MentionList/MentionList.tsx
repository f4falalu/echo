import type { SuggestionProps } from '@tiptap/suggestion';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { cn } from '@/lib/utils';
import type {
  MentionInputTriggerItem,
  MentionOnSelectParams,
  MentionTriggerItem,
} from '../MentionInput.types';
import { MentionListSelector } from './MentionListSelector';
export interface MentionListImperativeHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export type MentionListProps<T = string> = SuggestionProps<
  MentionInputTriggerItem<T>,
  MentionTriggerItem<T> & { trigger: string }
> & { trigger: string; emptyState?: React.ReactNode };

function MentionListInner<T = string>(
  { trigger, emptyState, items, command }: MentionListProps<T>,
  ref: React.ForwardedRef<MentionListImperativeHandle>
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = items[index] as MentionInputTriggerItem<T>;

    const isInvalidItem =
      ('type' in item && item.type === 'separator') || ('type' in item && item.type === 'group');

    if (isInvalidItem) {
      console.warn('invalid item', item);
      return;
    }

    if (item) {
      item.onSelect?.({
        value: item.value,
        disabled: item.disabled,
        loading: item.loading,
        selected: item.selected,
      } satisfies MentionOnSelectParams<T>);

      command({ ...item, trigger });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="flex flex-col p-1 bg-background rounded border w-full">
      {items.length ? (
        items.map((item, index: number) => (
          <MentionListSelector<T> key={index} {...item} isSelected={index === selectedIndex} />
        ))
      ) : (
        <div className="text-gray-light">{emptyState || 'No results'}</div>
      )}
    </div>
  );
}

export const MentionList = React.forwardRef(MentionListInner) as <T = string>(
  props: MentionListProps<T> & { ref?: React.ForwardedRef<MentionListImperativeHandle> }
) => ReturnType<typeof MentionListInner> & { displayName?: string };
