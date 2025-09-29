import type { Command } from 'cmdk';
import type React from 'react';
import type { MentionSuggestionExtension } from '../MentionInput';
import type { MentionInputProps, MentionTriggerItem } from '../MentionInput/MentionInput.types';

/**
 * @description Override the addValueToInput and closeOnSelect props for the item based on the group props
 */
export type GroupOverrideProps = {
  addValueToInput: boolean | undefined;
  closeOnSelect: boolean | undefined;
};

export type MentionInputSuggestionsDropdownItem<T = string> = {
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

export type MentionInputSuggestionsOnSelectParams = NonNullable<
  Pick<
    NonNullable<MentionInputSuggestionsDropdownItem>,
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

export type MentionInputSuggestionsDropdownGroup<T = string> = {
  label: string | React.ReactNode;
  suggestionItems: MentionInputSuggestionsDropdownItem<T>[];
  addValueToInput?: boolean;
  closeOnSelect?: boolean;
  type: 'group';
};

export type MentionInputSuggestionsSeparator = {
  type: 'separator';
};

export type MentionInputSuggestionsProps<T = string> = {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  submitting?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onSubmit: (value: string) => void;
  onPressEnter: MentionInputProps['onPressEnter'];
  onStop: () => void;
  variant?: 'default';
  autoFocus?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  emptyComponent?: React.ReactNode | string | false; //if false, no empty component will be shown
  children?: React.ReactNode;
  sendIcon?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  //mentions
  onMentionItemClick?: (params: MentionTriggerItem<T>) => void;
  mentions: MentionSuggestionExtension[];
  //suggestions
  suggestionItems: (
    | MentionInputSuggestionsDropdownItem<T>
    | MentionInputSuggestionsDropdownGroup<T>
    | MentionInputSuggestionsSeparator
  )[];
  onSuggestionItemClick?: (params: Omit<MentionInputSuggestionsOnSelectParams, 'onClick'>) => void;
  addSuggestionValueToInput?: boolean; //defaults to true
  closeSuggestionOnSelect?: boolean; //defaults to true
} & Pick<React.ComponentProps<typeof Command>, 'filter' | 'shouldFilter'>;

export type MentionInputSuggestionsContainerProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
} & Pick<
  MentionInputSuggestionsProps,
  'sendIcon' | 'secondaryActions' | 'submitting' | 'disabled' | 'onStop' | 'onSubmit' | 'variant'
>;
