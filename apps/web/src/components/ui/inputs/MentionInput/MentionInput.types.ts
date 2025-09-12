export type MentionTriggerItem<T = string> = {
  value: T;
  label: string | React.ReactNode;
  secondaryContent?: string | React.ReactNode;
  icon?: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'item';
  selected?: boolean;
  doNotAddContentOnSelect?: boolean;
};

export type MentionInputTriggerGroup<T = string> = {
  items: MentionTriggerItem<T>[];
  label: string | React.ReactNode;
  icon?: React.ReactNode;
  type?: 'group';
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
