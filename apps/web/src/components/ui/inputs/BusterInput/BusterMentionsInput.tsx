/** biome-ignore-all lint/complexity/noUselessFragments: Intersting bug when NOT using fragments */
import { Command } from 'cmdk';
import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Mention, type MentionProps, MentionsInput } from 'react-mentions';
import type { BusterInputProps } from './BusterInput.types';
import { DEFAULT_MENTION_MARKUP } from './parse-input';

export type BusterMentionsInputProps = Pick<
  BusterInputProps,
  'mentions' | 'value' | 'placeholder' | 'defaultValue'
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
  ...props
}: BusterMentionsInputProps) => {
  return (
    <React.Fragment>
      <MentionsInput
        value={value}
        onChange={(e) => onChangeInputValue(e.target.value)}
        placeholder={placeholder}
        style={{
          control: { fontSize: 16, minHeight: 46 },
          highlighter: { padding: 8 },
          input: { padding: 8 },
        }}
        className="swag"
        classNames={{
          highlighter: 'bg-red-500/10',
          suggestions: 'bg-blue-500/20 border',
          item: 'text-red-500',
        }}
      >
        {mentions?.length ? (
          mentions.map((mention) => <FormattedMention key={mention.trigger} {...mention} />)
        ) : (
          <Mention trigger="" markup={DEFAULT_MENTION_MARKUP} data={[]} appendSpaceOnAdd />
        )}
      </MentionsInput>

      <Command.Input value={value} {...props}>
        {children}
      </Command.Input>
    </React.Fragment>
  );
};

const FormattedMention = React.memo(
  (
    mention: NonNullable<BusterInputProps['mentions']>[number]
  ): React.ReactElement<MentionProps> => {
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
        displayTransform={mention.displayTransform}
        appendSpaceOnAdd={mention.appendSpaceOnAdd ?? true}
        renderSuggestion={(d) => d.display}
      />
    );
  }
);

FormattedMention.displayName = 'FormattedMention';
