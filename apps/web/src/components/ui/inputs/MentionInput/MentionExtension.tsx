import { Mention } from '@tiptap/extension-mention';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { createMentionSuggestionExtension } from './createMentionSuggestionOption';
import { MentionPill } from './MentionPill';

const atSuggestion = createMentionSuggestionExtension({
  trigger: '@',
  items: [
    { value: 'Lea Thompson', label: 'Lea Thompson' },
    { value: 'Cyndi Lauper', label: 'Cyndi Lauper' },
    { value: 'Tom Cruise', label: 'Tom Cruise' },
    { value: 'Madonna', label: 'Madonna' },
  ],
});

export const MentionExtension = Mention.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MentionPill, { as: 'span' });
  },
  addAttributes() {
    return {
      label: { default: '' },
      value: { default: '' },
    };
  },
}).configure({
  suggestions: [atSuggestion],
  deleteTriggerWithBackspace: true,
});
