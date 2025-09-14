import { createMentionSuggestionExtension } from './createMentionSuggestionOption';
import type { MentionInputTriggerItem } from './MentionInput.types';

const listOfSports: MentionInputTriggerItem[] = [
  {
    value: 'Basketball',
    label: 'Basketball',
  },
  {
    value: 'Soccer',
    label: 'Soccer',
  },
  {
    value: 'Tennis',
    label: 'Tennis',
  },
  {
    value: 'Baseball',
    label: 'Baseball',
  },
  {
    value: 'Hockey',
    label: 'Hockey',
  },
];

export const createShortcutsSuggestions = () => {
  return createMentionSuggestionExtension({
    trigger: '/',
    items: listOfSports,
    popoverContent: (props) => {
      return <div>Hello {props.value}</div>;
    },
  });
};
