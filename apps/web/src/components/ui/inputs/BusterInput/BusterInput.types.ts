import type { Command } from 'cmdk';
import type React from 'react';
import type { DisplayTransformFunc } from 'react-mentions';

/**
 * @description Override the addValueToInput and closeOnSelect props for the item based on the group props
 */
export type GroupOverrideProps = {
  addValueToInput: boolean | undefined;
  closeOnSelect: boolean | undefined;
};

export type BusterInputDropdownItem<T = string> = {
  value: T;
  inputValue?: string; //if this is undefined, the label will be used (string casted), must have addValueToInput set to true
  label: string | React.ReactNode;
  shortcut?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  closeOnSelect?: boolean; //defaults to parent
  type?: 'item';
  addValueToInput?: boolean; //defaults to group addValueToInput
};

export type BusterOnSelectParams = NonNullable<
  Pick<
    NonNullable<BusterInputDropdownItem>,
    | 'value'
    | 'label'
    | 'addValueToInput'
    | 'onClick'
    | 'inputValue'
    | 'closeOnSelect'
    | 'disabled'
    | 'loading'
  >
>;

export type BusterOnMentionClickParams = Pick<BusterMentionItem, 'value' | 'label'>;

export type BusterInputDropdownGroup<T = string> = {
  label: string | React.ReactNode;
  items: BusterInputDropdownItem<T>[];
  addValueToInput?: boolean;
  closeOnSelect?: boolean;
  type: 'group';
};

export type BusterInputSeperator = {
  type: 'separator';
};

export type BusterMentionItem<V = string, M = unknown> = {
  value: V;
  parsedValue?: string; //if this is undefined, the value will be used
  label: string | React.ReactNode;
  selected?: boolean;
  meta?: M;
};

export type BusterMentionItems<T = string, V = string, M = unknown> = {
  items: BusterMentionItem<V, M>[];
  displayTransform?: DisplayTransformFunc;
  style?: React.CSSProperties;
  appendSpaceOnAdd?: boolean; //defaults to true
  trigger: T;
  popoverContent?: (v: BusterMentionItem<V>) => React.ReactNode;
};

export type BusterMentions<V = string, T extends string = string, M = unknown> = BusterMentionItems<
  V,
  T,
  M
>[];

export type BusterInputProps<
  T = string,
  TMention = string,
  VMention extends string = string,
  MMention = unknown,
> = {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  submitting?: boolean;
  onSubmit: (value: string) => void;
  onStop: () => void;
  onItemClick?: (params: Omit<BusterOnSelectParams, 'onClick'>) => void;
  onMentionClick?: (params: BusterMentionItem<T>) => void;
  items: (BusterInputDropdownItem<T> | BusterInputDropdownGroup<T> | BusterInputSeperator)[];
  mentions?: BusterMentions<TMention, VMention, MMention>;
  variant?: 'default';
  sendIcon?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  addValueToInput?: boolean; //defaults to true
  closeOnSelect?: boolean; //defaults to true
  placeholder?: string;
  ariaLabel?: string;
  emptyComponent?: React.ReactNode | string | false; //if false, no empty component will be shown
} & Pick<React.ComponentProps<typeof Command>, 'filter' | 'shouldFilter'>;
