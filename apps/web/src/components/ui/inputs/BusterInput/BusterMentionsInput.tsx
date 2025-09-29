/** biome-ignore-all lint/complexity/noUselessFragments: Intersting bug when NOT using fragments */
import { Command } from 'cmdk';
import React from 'react';
import { MentionInput, type MentionInputProps } from '../MentionInput';
import type { BusterInputProps } from './BusterInput.types';

export type BusterMentionsInputProps = Pick<
  BusterInputProps,
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

export const BusterMentionsInput = ({
  value: valueProp,
  placeholder,
  defaultValue,
  mentions,
  value,
  ...props
}: BusterMentionsInputProps) => {
  return (
    <React.Fragment>
      <MentionInput mentions={mentions} defaultValue={value} {...props} />
      <Command.Input
        value={value}
        autoFocus={false}
        //  className="sr-only hidden h-0 border-0 p-0"
        className="absolute -top-5 left-0 w-full outline-1 outline-amber-200 pointer-events-none"
        aria-hidden="true"
      />
    </React.Fragment>
  );
};
