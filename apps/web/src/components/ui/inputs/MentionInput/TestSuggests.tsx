import PenWriting from '@/components/ui/icons/NucleoIconOutlined/pen-writing';
import Plus from '@/components/ui/icons/NucleoIconOutlined/plus';
import { createMentionSuggestionExtension } from './createMentionSuggestionOption';
import type { MentionInputTriggerItem } from './MentionInput.types';

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
  { type: 'separator' },
  {
    value: 'manageShortcuts',
    label: 'Manage Shortcuts',
    icon: <PenWriting />,
    doNotAddPipeOnSelect: true,
    onSelect: (props) => {
      console.log('manageShortcuts', props);
    },
  },
  {
    value: 'createShortcut',
    label: 'Create Shortcut',
    icon: <Plus />,
    doNotAddPipeOnSelect: true,
    onSelect: (props) => {
      console.log('createShortcut', props);
    },
  },
];

export const testSuggestions = () =>
  createMentionSuggestionExtension({
    trigger: '@',
    items: mentionItems,
    popoverContent: (props) => {
      return <div>Hello {props.value}</div>;
    },
    pillStyling: {
      className: 'bg-purple-100 border-purple-300 text-purple-500 hover:bg-purple-200',
    },
  });
