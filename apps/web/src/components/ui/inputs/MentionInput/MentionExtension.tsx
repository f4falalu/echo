import { Mention, type MentionNodeAttrs } from '@tiptap/extension-mention';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { SuggestionOptions } from '@tiptap/suggestion';
import { createMentionSuggestionExtension } from './createMentionSuggestionOption';
import type { MentionInputTriggerItem } from './MentionInput.types';
import { MentionPill, type MentionPillAttributes } from './MentionPill';

// Store items with popover content
const mentionItems: MentionInputTriggerItem[] = [
  {
    value: 'Lea Thompson',
    label: 'Lea Thompson',
    popoverContent: ({ label }) => <div>Popover for {label}</div>,
  },
  {
    value: 'Cyndi Lauper',
    label: 'Cyndi Lauper',
    popoverContent: ({ label }) => <div>Artist info for {label}</div>,
  },
  {
    value: 'Tom Cruise',
    label: 'Tom Cruise',
    popoverContent: ({ label }) => <div>Actor details for {label}</div>,
  },
  {
    value: 'Madonna',
    label: 'Madonna',
    popoverContent: ({ label }) => <div>Icon info for {label}</div>,
  },
];

const atSuggestion = createMentionSuggestionExtension({
  trigger: '@',
  items: mentionItems,
});

export const MentionExtension = Mention.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MentionPill, { as: 'span' });
  },
  addStorage() {
    return {
      mentionItems, // Store the items with popover content
    };
  },
  addAttributes() {
    return {
      label: '',
      value: '',
    } satisfies MentionPillAttributes;
  },
}).configure({
  suggestions: [atSuggestion] as Omit<
    SuggestionOptions<MentionInputTriggerItem, MentionNodeAttrs>,
    'editor'
  >[],
  deleteTriggerWithBackspace: true,
});
