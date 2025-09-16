import PenWriting from '@/components/ui/icons/NucleoIconOutlined/pen-writing';
import Plus from '@/components/ui/icons/NucleoIconOutlined/plus';
import { createMentionSuggestionExtension } from '../createMentionSuggestionOption';
import type { MentionInputTriggerItem } from '../MentionInput.types';
import { SecondaryContentDropdown } from '../SecondaryContentDropdown';
import { ShortcutPopoverContent } from './ShortcutPopoverContent';

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
    ].map((item) => ({
      ...item,
      secondaryContent: (
        <SecondaryContentDropdown
          items={[
            {
              label: 'Edit',
              value: 'edit',
              onClick: () => {
                console.log('edit');
              },
            },
            {
              label: 'Delete',
              value: 'delete',
              onClick: () => {
                console.log('delete');
              },
            },
          ]}
        />
      ),
    })),
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
    popoverContent: ShortcutPopoverContent,
  });
};
