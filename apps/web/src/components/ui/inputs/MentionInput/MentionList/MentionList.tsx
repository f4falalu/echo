import type { SuggestionProps } from '@tiptap/suggestion';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { useMount } from '@/hooks/useMount';
import { cn } from '@/lib/utils';
import type {
  MentionInputTriggerItem,
  MentionOnSelectParams,
  MentionTriggerItem,
} from '../MentionInput.types';
import { findFirstValueInItems, findNextValue, findPreviousValue } from './find-values-helpers';
import { MentionListSelector } from './MentionListSelector';
import { useListKeyboardShortcuts } from './useListKeyboardShortcuts';
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
  const selectItem = (value: T) => {
    const item = items.find((item) => (item as MentionTriggerItem<T>).value === value);

    if (!item) {
      console.warn('invalid item', value);
      return;
    }

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

  const { selectedItem, setSelectedItem } = useListKeyboardShortcuts(items, selectItem, ref);

  return (
    <div className="flex flex-col p-1 bg-background rounded border w-full">
      {items.length ? (
        items.map((item, index: number) => (
          <MentionListSelector<T>
            key={index}
            {...item}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
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
