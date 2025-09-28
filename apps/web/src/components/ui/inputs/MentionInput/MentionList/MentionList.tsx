import type { SuggestionProps } from '@tiptap/suggestion';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { cn } from '@/lib/utils';
import type {
  MentionInputTriggerItem,
  MentionOnSelectParams,
  MentionTriggerItem,
} from '../MentionInput.types';
import {
  findFirstValueInItems,
  findItemByValue,
  findNextValue,
  findPreviousValue,
} from './find-values-helpers';
import { MentionListSelector } from './MentionListSelector';
export interface MentionListImperativeHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export type MentionListProps<T = string> = SuggestionProps<
  MentionInputTriggerItem<T>,
  MentionTriggerItem<T> & { trigger: string }
> & { trigger: string; emptyState?: React.ReactNode; className?: string };

function MentionListInner<T = string>(
  { trigger, emptyState, items, command, className }: MentionListProps<T>,
  ref: React.ForwardedRef<MentionListImperativeHandle>
) {
  const [selectedItem, setSelectedItem] = useState<T | undefined>(undefined);

  const selectItem = (value: T) => {
    const item = findItemByValue(items, value);

    if (!item) {
      console.warn('item not found', value);
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
    const previousValue = findPreviousValue(items, selectedItem);
    if (previousValue !== undefined) {
      setSelectedItem(previousValue);
    }
  };

  const downHandler = () => {
    const nextValue = findNextValue(items, selectedItem);

    if (nextValue !== undefined) {
      setSelectedItem(nextValue);
    }
  };

  const enterHandler = () => {
    if (selectedItem) {
      selectItem(selectedItem);
    }
  };

  useEffect(() => {
    const firstValue = findFirstValueInItems(items);
    if (firstValue !== undefined) {
      setSelectedItem(firstValue);
    }
  }, [items]);

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
    <div
      className={cn(
        'flex flex-col p-1 bg-background rounded border w-full min-w-[200px] max-w-[280px] overflow-x-auto',
        'max-h-[300px] overflow-y-auto',
        className
      )}
    >
      {items.length ? (
        items.map((item, index: number) => (
          <MentionListSelector<T>
            key={index}
            {...item}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            onSelectItem={selectItem}
          />
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
