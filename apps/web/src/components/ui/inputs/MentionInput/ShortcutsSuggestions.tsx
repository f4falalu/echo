import PenWriting from '@/components/ui/icons/NucleoIconOutlined/pen-writing';
import Plus from '@/components/ui/icons/NucleoIconOutlined/plus';
import { createMentionSuggestionExtension } from './createMentionSuggestionOption';
import type { MentionInputTriggerItem } from './MentionInput.types';

const listOfSports: MentionInputTriggerItem[] = [
  {
    type: 'group',
    label: 'Sports',
    items: [
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
    ],
  },
  { type: 'separator' },
  {
    value: 'manageShortcuts',
    label: 'Manage Shortcuts',
    icon: <PenWriting />,
    doNotAddPipeOnSelect: true as const,
    onSelect: (props) => {
      console.log('manageShortcuts', props);
    },
  },
  {
    value: 'createShortcut',
    label: 'Create Shortcut',
    icon: <Plus />,
    doNotAddPipeOnSelect: true as const,
    onSelect: (props) => {
      console.log('createShortcut', props);
    },
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
