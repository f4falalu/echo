/** biome-ignore-all lint/complexity/noUselessFragments: Intersting bug when NOT using fragments */
import { Command } from 'cmdk';
import React, { type Component, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Mention, type MentionProps, MentionsInput, type MentionsInputProps } from 'react-mentions';
import { useMount } from '@/hooks/useMount';
import { cn } from '@/lib/classMerge';
import type { BusterInputProps } from './BusterInput.types';
import { DEFAULT_MENTION_MARKUP } from './parse-input';

export type BusterMentionsInputProps = Pick<
  BusterInputProps,
  | 'mentions'
  | 'value'
  | 'placeholder'
  | 'defaultValue'
  | 'shouldFilter'
  | 'filter'
  | 'onMentionClick'
> & {
  onChangeInputValue: (value: string) => void;
} & React.ComponentPropsWithoutRef<typeof Command.Input>;

export const BusterMentionsInput = ({
  children,
  value: valueProp,
  placeholder,
  defaultValue,
  mentions,
  value,
  onChangeInputValue,
  className,
  style,
  ...props
}: BusterMentionsInputProps) => {
  const ref = useRef<Component<MentionsInputProps>>(null);
  const mentionsComponents = useFormattedMentions(mentions);

  return (
    <React.Fragment>
      <MentionsInput
        ref={ref}
        value={value}
        onChange={(e) => onChangeInputValue(e.target.value)}
        placeholder={placeholder}
        style={
          {
            //   control: { fontSize: 16 },
            //   highlighter: { padding: 8, background: 'yellow' },
            //   input: { padding: 8 },
            //  '&multiLine': {},
            //   '&singleLine': {},
          }
        }
        className={cn(className)}
        autoFocus
      >
        {mentionsComponents}
      </MentionsInput>

      <Command.Input
        value={value}
        {...props}
        autoFocus={false}
        className="absolute -top-5 left-0 w-full outline-1 outline-amber-200 pointer-events-none"
      >
        {children}
      </Command.Input>
    </React.Fragment>
  );
};

const useFormattedMentions = (mentions: BusterInputProps['mentions']) => {
  return useMemo(
    () =>
      mentions?.map((mention) => {
        const formattedItems = mention.items.map((item) => ({
          id: String(item.value),
          display: typeof item.label === 'string' ? item.label : String(item.value),
        }));
        return (
          <Mention
            key={mention.trigger}
            trigger={mention.trigger}
            markup={DEFAULT_MENTION_MARKUP}
            data={formattedItems}
            displayTransform={
              mention.displayTransform ??
              (() => {
                return <div></div>;
              })
            }
            appendSpaceOnAdd={mention.appendSpaceOnAdd ?? true}
            renderSuggestion={(d) => d.display}
          />
        );
      }) ?? <Mention trigger="" markup={DEFAULT_MENTION_MARKUP} data={[]} appendSpaceOnAdd />,
    [mentions]
  );
};
