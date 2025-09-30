import type { ListShortcutsResponse, Shortcut } from '@buster/server-shared/shortcuts';
import { useNavigate } from '@tanstack/react-router';
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

export const useCreateShortcutsMentionsSuggestions = (
  shortcuts: ListShortcutsResponse['shortcuts'],
  setOpenCreateShortcutModal: (open: boolean) => void
) => {
  const navigate = useNavigate();

  return useMemo(
    () =>
      createMentionSuggestionExtension({
        trigger: '/',
        items: [
          ...shortcuts.map(createShortcut),
          { type: 'separator' },
          {
            value: 'manageShortcuts',
            label: 'Manage shortcuts',
            icon: <PenWriting />,
            doNotAddPipeOnSelect: true,
            onSelect: () => {
              navigate({
                to: '/app/home/shortcuts',
              });
            },
          },
          {
            value: 'createShortcut',
            label: 'Create shortcut',
            icon: <Plus />,
            doNotAddPipeOnSelect: true,
            onSelect: () => {
              setOpenCreateShortcutModal(true);
            },
          },
        ],
        popoverContent: ShortcutPopoverContent,
      }),
    [shortcuts, setOpenCreateShortcutModal]
  );
};

const createShortcut = (shortcut: Shortcut): MentionInputTriggerItem<string> => {
  return {
    value: shortcut.id,
    label: shortcut.name,
    icon: <PenWriting />,
    onSelect: (props) => {
      console.log('onSelect shortcut?', props);
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
