import { Mention, type MentionNodeAttrs } from '@tiptap/extension-mention';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { SuggestionOptions } from '@tiptap/suggestion';
import type { MentionInputTriggerItem, MentionPopoverContentCallback } from './MentionInput.types';
import { MentionPill, type MentionPillAttributes } from './MentionPill';
import { createShortcutsSuggestions } from './ShortcutsSuggestions';
import { testSuggestions } from './TestSuggests';

export const MentionExtension = Mention.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MentionPill, { as: 'span' });
  },
  addStorage() {
    return {
      pillStylingByTrigger: new Map<string, { className?: string; style?: React.CSSProperties }>(), // trigger -> styling //will be set in the beforeCreate on the suggestion extension
      popoverByTrigger: new Map<string, MentionPopoverContentCallback>(), // trigger -> popover content //will be set in the beforeCreate on the suggestion extension
    };
  },
  addAttributes() {
    return {
      label: '',
      value: '',
      trigger: '',
    } satisfies MentionPillAttributes;
  },
  addCommands() {
    return {
      setPopoverByTrigger:
        (trigger: string, popoverContent: MentionPopoverContentCallback) => () => {
          this.editor.storage.mention.popoverByTrigger.set(trigger, popoverContent);
        },
      getPopoverByTrigger: (trigger) => () => {
        return this.editor.storage.mention.popoverByTrigger.get(trigger);
      },
      setPillStylingByTrigger:
        (trigger: string, pillStyling: { className?: string; style?: React.CSSProperties }) =>
        () => {
          this.editor.storage.mention.pillStylingByTrigger.set(trigger, pillStyling);
        },
      getPillStylingByTrigger: (trigger: string) => () => {
        return this.editor.storage.mention.pillStylingByTrigger.get(trigger);
      },
    };
  },
}).configure({
  suggestions: [testSuggestions(), createShortcutsSuggestions()] as Omit<
    SuggestionOptions<MentionInputTriggerItem, MentionNodeAttrs>,
    'editor'
  >[],
  deleteTriggerWithBackspace: true,
});
