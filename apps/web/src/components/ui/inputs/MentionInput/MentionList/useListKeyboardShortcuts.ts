import { useEffect, useImperativeHandle, useState } from 'react';
import type { MentionInputTriggerItem } from '../MentionInput.types';
import { findFirstValueInItems, findNextValue, findPreviousValue } from './find-values-helpers';
import type { MentionListImperativeHandle } from './MentionList';

export const useListKeyboardShortcuts = <T = string>(
  items: MentionInputTriggerItem<T>[],
  selectItem: (item: T) => void,
  ref: React.ForwardedRef<MentionListImperativeHandle>
) => {
  const [selectedItem, setSelectedItem] = useState<T | undefined>(undefined);

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
  }, []);

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

  return {
    selectedItem,
    setSelectedItem,
  };
};
