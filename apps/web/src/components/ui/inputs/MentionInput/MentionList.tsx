import { SuggestionProps } from '@tiptap/suggestion';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { cn } from '@/lib/utils';
import { Dropdown } from '../../dropdown';
import type { MentionInputTriggerItem } from './MentionInput.types';
export interface MentionListImperativeHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export type MentionListProps<T = string> = SuggestionProps<MentionInputTriggerItem<T>>;

function MentionListInner<T = string>(
  props: MentionListProps<T>,
  ref: React.ForwardedRef<MentionListImperativeHandle>
) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  console.log(props);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command({ id: item });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

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
      {props.items.length ? (
        props.items.map((item, index: number) => (
          <div
            className={cn('w-full min-w-fit', index === selectedIndex ? 'bg-muted' : '', 'w-full')}
            key={index}
            onClick={() => selectItem(index)}
          >
            {'label' in item
              ? item.label
              : 'type' in item && item.type === 'separator'
                ? '---'
                : ''}
          </div>
        ))
      ) : (
        <div className="item">No result</div>
      )}
    </div>
  );
}

export const MentionList = React.forwardRef(MentionListInner) as <T = string>(
  props: MentionListProps<T> & { ref?: React.ForwardedRef<MentionListImperativeHandle> }
) => ReturnType<typeof MentionListInner> & { displayName?: string };
