import { createMentionSuggestionExtension } from '@/components/ui/inputs/MentionInput';
import type { MentionInputTriggerItem } from '../../../ui/inputs/MentionInput/MentionInput.types';

// Store items with popover content
const mentionItems: MentionInputTriggerItem[] = [
  {
    value: 'Lea Thompson',
    label: 'Lea Thompson',
  },
  {
    value: 'Cyndi Lauper',
    label: 'Cyndi Lauper',
  },
  {
    value: 'Tom Cruise',
    label: 'Tom Cruise',
  },
  {
    value: 'Madonna',
    label: 'Madonna',
  },
];

export const testSuggestions = () =>
  createMentionSuggestionExtension({
    trigger: '@',
    items: mentionItems as MentionInputTriggerItem[],
    popoverContent: (props) => {
      return <div>Hello {props.value}</div>;
    },
    pillStyling: {
      className: 'bg-purple-100 border-purple-300 text-purple-500 hover:bg-purple-200',
    },
    onChangeTransform: (v) => {
      return `[@${String(v.label)}](${String(v.value)})`;
    },
  });
