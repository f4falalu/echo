import type { MentionOptions } from '@tiptap/extension-mention';

export type MentionOnSelectParams = Pick<
  MentionTriggerItem,
  'value' | 'onSelect' | 'doNotAddPipeOnSelect' | 'loading' | 'disabled' | 'selected'
>;

export type MentionTriggerItem<T = string> = {
  value: T;
  label: string | React.ReactNode;
  labelMatches?: string[]; //if this is provided, we will use it to filter the items
  secondaryContent?: string | React.ReactNode;
  icon?: React.ReactNode;
  onSelect?: (d: MentionOnSelectParams) => void;
  disabled?: boolean; //will inherit from if undefined
  loading?: boolean;
  type?: 'item';
  selected?: boolean;
  doNotAddPipeOnSelect?: boolean;
};

export type MentionInputTriggerGroup<T = string> = {
  items: MentionTriggerItem<T>[];
  label: string | React.ReactNode;
  icon?: React.ReactNode;
  type: 'group';
  disabled?: boolean;
};

export type MentionInputTriggerSeparator = {
  type: 'separator';
};

export type MentionInputTriggerItem<T = string> =
  | MentionTriggerItem<T>
  | MentionInputTriggerGroup<T>
  | MentionInputTriggerSeparator;

export type MentionInputTrigger<T = string> = {
  trigger: string;
  items: MentionInputTriggerItem<T>;
};

export type MentionInputProps = {
  className?: string;
  style?: React.CSSProperties;
};

//The tip tap type for a suggestion

export type MentionSuggestionExtension = MentionOptions<MentionInputTriggerItem>['suggestion'];
