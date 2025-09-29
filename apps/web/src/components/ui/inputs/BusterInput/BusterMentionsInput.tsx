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
  className?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  readOnly?: boolean;
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
        className="absolute -top-5 left-0 w-full outline-1 outline-amber-200 pointer-events-none"
      />
    </React.Fragment>
  );
};
