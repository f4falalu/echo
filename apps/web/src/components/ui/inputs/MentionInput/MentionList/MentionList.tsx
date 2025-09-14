import type { SuggestionProps } from '@tiptap/suggestion';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { cn } from '@/lib/utils';
import type {
  MentionInputTriggerItem,
  MentionOnSelectParams,
  MentionTriggerItem,
} from '../MentionInput.types';
export interface MentionListImperativeHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export type MentionListProps<T = string> = SuggestionProps<
  MentionInputTriggerItem<T>,
  MentionTriggerItem<T> & { trigger: string }
> & { trigger: string };

function MentionListInner<T = string>(
  { trigger, ...props }: MentionListProps<T>,
  ref: React.ForwardedRef<MentionListImperativeHandle>
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index] as MentionTriggerItem<T>;
    if (item) {
      props.command({ ...item, trigger });
      item.onSelect?.({
        value: item.value,
        disabled: item.disabled,
        loading: item.loading,
        selected: item.selected,
      } satisfies MentionOnSelectParams<T>);
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
            className={cn(
              'w-full min-w-fit hover:bg-item-hover',
              index === selectedIndex && 'bg-item-hover hover:bg-item-hover-active'
            )}
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
