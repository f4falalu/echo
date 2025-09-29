/** biome-ignore-all lint/complexity/noUselessFragments: Intersting bug when NOT using fragments */
import { Command } from 'cmdk';
import React, { forwardRef } from 'react';
import { MentionInput, type MentionInputProps, type MentionInputRef } from '../MentionInput';
import type { MentionInputSuggestionsProps } from './MentionInputSuggestions.types';

export type MentionInputSuggestionsMentionsInputProps = Pick<
  MentionInputSuggestionsProps,
  | 'mentions'
  | 'value'
  | 'placeholder'
  | 'defaultValue'
  | 'shouldFilter'
  | 'filter'
  | 'onMentionItemClick'
> & {
  onChange: MentionInputProps['onChange'];
  onPressEnter: MentionInputProps['onPressEnter'];
  className?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  readOnly?: boolean;
  commandListNavigatedRef?: React.RefObject<boolean>;
};

export const MentionInputSuggestionsMentionsInput = forwardRef<
  MentionInputRef,
  MentionInputSuggestionsMentionsInputProps
>(({ value: valueProp, placeholder, defaultValue, mentions, value, ...props }, ref) => {
  return (
    <React.Fragment>
      <MentionInput ref={ref} mentions={mentions} defaultValue={value} {...props} />
      <Command.Input
        value={value}
        autoFocus={false}
        className="sr-only hidden h-0 border-0 p-0 pointer-events-none w-full"
        aria-hidden="true"
      />
    </React.Fragment>
  );
});

MentionInputSuggestionsMentionsInput.displayName = 'MentionInputSuggestionsMentionsInput';
