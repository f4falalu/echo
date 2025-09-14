import type { MentionNodeAttrs, MentionOptions } from '@tiptap/extension-mention';
import type { MentionPillAttributes } from './MentionPill';

export type MentionOnSelectParams<T = unknown> = {
  value: T;
  loading?: boolean;
  disabled?: boolean;
  selected?: boolean;
};

export type MentionPopoverContentCallback = (
  props: Pick<MentionTriggerItem, 'value'>
) => React.ReactNode;

export type MentionPopoverStorageSet = Set<MentionPopoverContentCallback>;

type MentionTriggerItemBase<T = string> = {
  value: T;
  label: string | React.ReactNode;
  labelMatches?: string[]; //if this is provided, we will use it to filter the items
  secondaryContent?: string | React.ReactNode;
  icon?: React.ReactNode;
  onSelect?: (d: MentionOnSelectParams) => void | Promise<void>;
  disabled?: boolean; //will inherit from if undefined
  loading?: boolean;
  type?: 'item';
  selected?: boolean;
  doNotAddPipeOnSelect?: false;
};

type MentionTriggerItemNotPiped<T = string> = MentionTriggerItemBase<T> & {
  doNotAddPipeOnSelect: true;
};

export type MentionTriggerItem<T = string> =
  | MentionTriggerItemBase<T>
  | MentionTriggerItemNotPiped<T>;

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

export type MentionStylePillProps = {
  className?: string;
  style?: React.CSSProperties;
};

//The tip tap type for a suggestion

export type MentionSuggestionExtension<T = string> = MentionOptions<
  MentionInputTriggerItem<T>,
  MentionPillAttributes & MentionNodeAttrs
>['suggestion'];

declare module '@tiptap/core' {
  interface Storage {
    mention: {
      popoverByTrigger: Map<string, MentionPopoverContentCallback>;
      pillStylingByTrigger: Map<string, MentionStylePillProps>;
    };
  }
  interface Commands {
    mention: {
      setPopoverByTrigger: (trigger: string, popoverContent: MentionPopoverContentCallback) => void;
      getPopoverByTrigger: (trigger: string) => MentionPopoverContentCallback | undefined;
      setPillStylingByTrigger: (trigger: string, pillStyling: MentionStylePillProps) => void;
      getPillStylingByTrigger: (trigger: string) => MentionStylePillProps | undefined;
    };
  }
}
