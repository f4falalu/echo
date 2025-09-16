import { Trash } from '@/components/ui/icons';
import PenWriting from '@/components/ui/icons/NucleoIconOutlined/pen-writing';
import Plus from '@/components/ui/icons/NucleoIconOutlined/plus';
import {
  createMentionSuggestionExtension,
  type MentionInputTriggerItem,
  MentionSecondaryContentDropdown,
} from '@/components/ui/inputs/MentionInput';
import { ShortcutPopoverContent } from './ShortcutPopoverContent';

const listOfSports: MentionInputTriggerItem[] = [
  {
    type: 'group',
    label: 'Sports',
    items: [
      {
        value: 'Basketball',
        label: 'Basketball with a really long label like super long',
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
        <MentionSecondaryContentDropdown
          items={[
            {
              label: 'Edit',
              icon: <PenWriting />,
              value: 'edit',
              onClick: () => {
                console.log('edit');
              },
            },
            {
              label: 'Delete',
              icon: <Trash />,
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
    label: 'Manage shortcuts',
    icon: <PenWriting />,
    doNotAddPipeOnSelect: true,
    onSelect: (props) => {
      console.log('manageShortcuts', props);
    },
  },
  {
    value: 'createShortcut',
    label: 'Create shortcut',
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
