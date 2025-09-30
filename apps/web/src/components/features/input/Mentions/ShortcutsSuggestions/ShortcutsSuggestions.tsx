import type { ListShortcutsResponse, Shortcut } from '@buster/server-shared/shortcuts';
import { useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useDeleteShortcut, useGetShortcut } from '@/api/buster_rest/shortcuts/queryRequests';
import { ErrorCard } from '@/components/ui/error/ErrorCard';
import { Trash } from '@/components/ui/icons';
import PenWriting from '@/components/ui/icons/NucleoIconOutlined/pen-writing';
import Plus from '@/components/ui/icons/NucleoIconOutlined/plus';
import {
  createMentionSuggestionExtension,
  MentionSecondaryContentDropdown,
  type MentionTriggerItem,
} from '@/components/ui/inputs/MentionInput';
import type {
  MentionInputSuggestionsDropdownItem,
  MentionInputSuggestionsProps,
  MentionInputSuggestionsRef,
} from '@/components/ui/inputs/MentionInputSuggestions';
import { CircleSpinnerLoader } from '@/components/ui/loaders';
import { ShortcutPopoverContent } from './ShortcutPopoverContent';

export const SHORTCUT_MENTION_TRIGGER = '/';

export const useCreateShortcutsMentionsSuggestions = (
  shortcuts: ListShortcutsResponse['shortcuts'],
  setOpenCreateShortcutModal: (open: boolean) => void
) => {
  const navigate = useNavigate();
  const createShortcutForMention = useCreateShortcutForMention();

  return useMemo(
    () =>
      createMentionSuggestionExtension({
        trigger: SHORTCUT_MENTION_TRIGGER,
        items: [
          ...shortcuts.map(createShortcutForMention),
          { type: 'separator' as const },
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
        onChangeTransform: (v) => {
          const foundShortcut = shortcuts.find((shortcut) => shortcut.name === v.label);
          if (foundShortcut) {
            return foundShortcut.instructions;
          }
          return v.value;
        },
      }),
    [shortcuts, setOpenCreateShortcutModal]
  );
};

export const useCreateShortcutForMention = () => {
  const navigate = useNavigate();
  const { mutateAsync: deleteShortcut } = useDeleteShortcut();
  const createShortcutForMention = (shortcut: Shortcut): MentionTriggerItem<string> => {
    return {
      value: shortcut.id,
      label: shortcut.name,
      icon: <PenWriting />,
      secondaryContent: (
        <MentionSecondaryContentDropdown
          items={[
            {
              label: 'Edit',
              icon: <PenWriting />,
              value: 'edit',
              onClick: () => {
                navigate({
                  to: '/app/home/shortcuts',
                  search: {
                    shortcut_id: shortcut.id,
                  },
                });
              },
            },
            {
              label: 'Delete',
              icon: <Trash />,
              value: 'delete',
              onClick: () => {
                deleteShortcut({ id: shortcut.id });
              },
            },
          ]}
        />
      ),
    };
  };

  return createShortcutForMention;
};
export const useShortcutsSuggestions = (
  shortcuts: ListShortcutsResponse['shortcuts'],
  setOpenCreateShortcutModal: (open: boolean) => void,
  mentionInputSuggestionsRef: React.RefObject<MentionInputSuggestionsRef | null>
): MentionInputSuggestionsProps['suggestionItems'] => {
  const createShortcutForMention = useCreateShortcutForMention();
  return useMemo(() => {
    const shortcutsItems = shortcuts.map<MentionInputSuggestionsDropdownItem>((shortcut) => {
      return {
        type: 'item',
        value: shortcut.name,
        label: shortcut.name,
        popoverContent: <ShortcutSuggestionsPopoverContent shortcut={shortcut} />,
        icon: SHORTCUT_MENTION_TRIGGER,
        inputValue: `${SHORTCUT_MENTION_TRIGGER} ${shortcut.name}`,
        onClick: () => {
          const addMentionToInput = mentionInputSuggestionsRef.current?.addMentionToInput;
          if (!addMentionToInput) {
            console.warn('addMentionToInput is not defined', mentionInputSuggestionsRef.current);
            return;
          }
          const shortcutForMention = createShortcutForMention(shortcut);
          addMentionToInput?.({
            ...shortcutForMention,
            trigger: SHORTCUT_MENTION_TRIGGER,
          });
        },
      };
    });

    shortcutsItems.push({
      type: 'item',
      value: 'createShortcut',
      label: 'Create shortcut',
      keywords: ['create', 'shortcut'],
      icon: <Plus />,
      inputValue: `${SHORTCUT_MENTION_TRIGGER} Create shortcut`,
      onClick: () => {
        setOpenCreateShortcutModal(true);
      },
      closeOnSelect: false,
      addValueToInput: false,
    });

    return [
      {
        type: 'group',
        label: 'Shortcuts',
        suggestionItems: shortcutsItems,
        addValueToInput: false,
        closeOnSelect: true,
      },
    ];
  }, [shortcuts, setOpenCreateShortcutModal, mentionInputSuggestionsRef]);
};

const ShortcutSuggestionsPopoverContent = ({ shortcut }: { shortcut: Shortcut }) => {
  const { isFetched, isError } = useGetShortcut({ id: shortcut.id });

  if (!isFetched) return null;

  if (isError) return <ErrorCard message="Error fetching shortcut" />;

  return <ShortcutPopoverContent value={shortcut.id} />;
};
