import type React from 'react';
import type { DisplayTransformFunc } from 'react-mentions';

export type BusterInputDropdownItem<T = string> = {
  value: T;
  label: string | React.ReactNode;
  shortcut?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  closeOnSelect?: boolean; //defaults to parent
};

export type BusterInputDropdownGroup<T = string> = {
  label: string | React.ReactNode;
  items: BusterInputDropdownItem<T>[];
};

export type BusterMentionItem<V = string> = {
  value: V;
  parsedValue?: string; //if this is undefined, the value will be used
  label: string | React.ReactNode;
  selected?: boolean;
};

export type BusterMentionItems<V = string, T = string> = {
  items: BusterMentionItem<V>[];
  displayTransform?: DisplayTransformFunc;
  style?: React.CSSProperties;
  appendSpaceOnAdd?: boolean; //defaults to true
  trigger: T;
  popoverContent?: (v: BusterMentionItem<V>) => React.ReactNode;
};

export type BusterMentionRecords<V = string, T extends string = string> = {
  [K in T]: BusterMentionItems<V, T>;
};

export type BusterInputProps<T = string> = {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  submitting?: boolean;
  onSubmit: (value: string) => void;
  onStop: () => void;
  onItemClick?: (value: string) => void;
  items: (BusterInputDropdownItem<T> | BusterInputDropdownGroup<T>)[];
  mentions?: BusterMentionRecords<T>;
  variant?: 'default';
  sendIcon?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  closeOnSelect?: boolean; //defaults to true
};
