import type { ListShortcutsResponse, Shortcut } from '@buster/server-shared/shortcuts';
import { useMemo } from 'react';
import { Trash } from '@/components/ui/icons';
import PenWriting from '@/components/ui/icons/NucleoIconOutlined/pen-writing';
import Plus from '@/components/ui/icons/NucleoIconOutlined/plus';
import {
  createMentionSuggestionExtension,
  type MentionInputTriggerItem,
  MentionSecondaryContentDropdown,
} from '@/components/ui/inputs/MentionInput';
import { ShortcutPopoverContent } from './ShortcutPopoverContent';

export const createShortcutsMentionsSuggestions = (
  shortcuts: ListShortcutsResponse['shortcuts']
) => {
  return createMentionSuggestionExtension({
    trigger: '/',
    items: createAllItems(shortcuts),
    popoverContent: ShortcutPopoverContent,
  });
};

const createAllItems = (
  shortcuts: ListShortcutsResponse['shortcuts']
): MentionInputTriggerItem[] => {
  return [
    ...shortcuts.map(createShortcut),
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
};

const createShortcut = (shortcut: Shortcut): MentionInputTriggerItem<string> => {
  return {
    value: shortcut.id,
    label: shortcut.name,
    icon: <PenWriting />,
    onSelect: (props) => {
      console.log('createShortcut', props);
    },
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
  };
};
