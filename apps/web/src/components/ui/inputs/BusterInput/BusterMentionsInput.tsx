/** biome-ignore-all lint/complexity/noUselessFragments: Intersting bug when NOT using fragments */
import { Command } from 'cmdk';
import React from 'react';
import { cn } from '@/lib/classMerge';
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
  return (
    <React.Fragment>
      <textarea />

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
