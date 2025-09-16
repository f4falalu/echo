import type { Command } from 'cmdk';
import type React from 'react';
import type { MentionSuggestionExtension } from '../MentionInput';
import type { MentionTriggerItem } from '../MentionInput/MentionInput.types';

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

export type BusterInputDropdownGroup<T = string> = {
  label: string | React.ReactNode;
  suggestionItems: BusterInputDropdownItem<T>[];
  addValueToInput?: boolean;
  closeOnSelect?: boolean;
  type: 'group';
};

export type BusterInputSeperator = {
  type: 'separator';
};

export type BusterInputProps<T = string> = {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  submitting?: boolean;
  disabled?: boolean;
  onSubmit: (value: string) => void;
  onStop: () => void;
  variant?: 'default';
  sendIcon?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  placeholder?: string;
  ariaLabel?: string;
  emptyComponent?: React.ReactNode | string | false; //if false, no empty component will be shown
  //mentions
  onMentionItemClick?: (params: MentionTriggerItem<T>) => void;
  mentions?: MentionSuggestionExtension[];
  //suggestions
  suggestionItems: (
    | BusterInputDropdownItem<T>
    | BusterInputDropdownGroup<T>
    | BusterInputSeperator
  )[];
  onSuggestionItemClick?: (params: Omit<BusterOnSelectParams, 'onClick'>) => void;
  addSuggestionValueToInput?: boolean; //defaults to true
  closeSuggestionOnSelect?: boolean; //defaults to true
} & Pick<React.ComponentProps<typeof Command>, 'filter' | 'shouldFilter'>;

export type BusterInputContainerProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
} & Pick<
  BusterInputProps,
  'sendIcon' | 'secondaryActions' | 'submitting' | 'disabled' | 'onStop' | 'onSubmit' | 'variant'
>;
