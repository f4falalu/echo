import type { ListShortcutsResponse } from '@buster/server-shared/shortcuts';
import type { GetSuggestedPromptsResponse } from '@buster/server-shared/user';
import type { Editor } from '@tiptap/react';
import sampleSize from 'lodash/sampleSize';
import React, { useMemo, useRef, useState } from 'react';
import { useCreateShortcutsMentionsSuggestions } from '@/components/features/input/Mentions/ShortcutsSuggestions/ShortcutsSuggestions';
import { Plus } from '@/components/ui/icons';
import CircleQuestion from '@/components/ui/icons/NucleoIconOutlined/circle-question';
import FileSparkle from '@/components/ui/icons/NucleoIconOutlined/file-sparkle';
import type { MentionSuggestionExtension } from '@/components/ui/inputs/MentionInput';
import type {
  MentionInputSuggestionsDropdownItem,
  MentionInputSuggestionsProps,
  MentionInputSuggestionsRef,
} from '@/components/ui/inputs/MentionInputSuggestions';
import { MentionInputSuggestions } from '@/components/ui/inputs/MentionInputSuggestions';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { ASSET_ICONS } from '../../icons/assetIcons';
import { NewShortcutModal } from '../../modals/NewShortcutModal';
import { BusterChatInputButtons, type BusterChatInputMode } from './BusterChatInputButtons';

export type BusterChatInput = {
  defaultValue: string;
  onSubmit: (value: string) => void;
  onStop: () => void;
  submitting: boolean;
  disabled: boolean;
  shortcuts: ListShortcutsResponse['shortcuts'];
  suggestedPrompts: GetSuggestedPromptsResponse['suggestedPrompts'];
};

export const BusterChatInputBase: React.FC<BusterChatInput> = React.memo(
  ({ defaultValue, onSubmit, onStop, submitting, disabled, shortcuts, suggestedPrompts }) => {
    const mentionInputSuggestionsRef = useRef<MentionInputSuggestionsRef>(null);
    const uniqueSuggestions = useUniqueSuggestions(suggestedPrompts);
    const [openCreateShortcutModal, setOpenCreateShortcutModal] = useState(false);
    const [mode, setMode] = useState<BusterChatInputMode>('auto');
    const shortcutsSuggestions = useShortcuts(
      shortcuts,
      setOpenCreateShortcutModal,
      mentionInputSuggestionsRef.current?.onChangeValue
    );

    const suggestionItems: MentionInputSuggestionsProps['suggestionItems'] = useMemo(() => {
      const items: MentionInputSuggestionsProps['suggestionItems'] = [...uniqueSuggestions];

      if (items.length > 0 && shortcutsSuggestions.length > 0) {
        items.push({
          type: 'separator',
        });
      }

      if (shortcutsSuggestions.length > 0) {
        items.push(...shortcutsSuggestions);
      }

      return items;
    }, [uniqueSuggestions, shortcutsSuggestions]);

    const shortcutsMentionsSuggestions = useCreateShortcutsMentionsSuggestions(
      shortcuts,
      setOpenCreateShortcutModal
    );

    const mentions: MentionSuggestionExtension[] = useMemo(() => {
      return [shortcutsMentionsSuggestions];
    }, [shortcutsMentionsSuggestions]);

    const onDictate = useMemoizedFn((transcript: string) => {
      mentionInputSuggestionsRef.current?.onChangeValue(transcript);
    });

    const onSubmitPreflight = (value: string) => {
      if (submitting) {
        console.warn('Input is submitting');
        return;
      }
      if (disabled) {
        console.warn('Input is disabledGlobal');
        return;
      }
      onSubmit(value);
    };

    const onPressEnter: MentionInputSuggestionsProps['onPressEnter'] = useMemoizedFn(
      (value, _editorObjects, _rawText) => {
        onSubmitPreflight(value);
      }
    );

    const onSubmitButton = useMemoizedFn(() => {
      const value = mentionInputSuggestionsRef.current?.getValue();

      if (value) {
        onSubmitPreflight(value.transformedValue);
      }
    });

    return (
      <React.Fragment>
        <MentionInputSuggestions
          defaultValue={defaultValue}
          onPressEnter={onPressEnter}
          mentions={mentions}
          suggestionItems={suggestionItems}
          placeholder="Ask a question or type ‘/’ for shortcuts..."
          ref={mentionInputSuggestionsRef}
        >
          <BusterChatInputButtons
            onSubmit={onSubmitButton}
            onStop={onStop}
            submitting={submitting}
            disabled={disabled}
            mode={mode}
            onModeChange={setMode}
            onDictate={onDictate}
          />
        </MentionInputSuggestions>

        <NewShortcutModal
          open={openCreateShortcutModal}
          onClose={() => setOpenCreateShortcutModal(false)}
        />
      </React.Fragment>
    );
  }
);

BusterChatInputBase.displayName = 'BusterChatInputBase';

const iconRecord: Record<keyof GetSuggestedPromptsResponse['suggestedPrompts'], React.ReactNode> = {
  report: <FileSparkle />,
  dashboard: <ASSET_ICONS.dashboards />,
  visualization: <ASSET_ICONS.metrics />,
  help: <CircleQuestion />,
};

const useUniqueSuggestions = (
  suggestedPrompts: GetSuggestedPromptsResponse['suggestedPrompts']
): MentionInputSuggestionsProps['suggestionItems'] => {
  return useMemo(() => {
    const allSuggestions: { type: keyof typeof suggestedPrompts; value: string }[] = Object.entries(
      suggestedPrompts
    ).flatMap(([key, value]) => {
      return value.map((prompt) => {
        return {
          type: key as keyof typeof suggestedPrompts,
          value: prompt,
        };
      });
    });

    // Ensure we have at least 4 suggestions
    if (allSuggestions.length < 4) {
      throw new Error('Not enough suggestions available - need at least 4');
    }

    const fourUniqueSuggestions = sampleSize(allSuggestions, 4);

    const items: MentionInputSuggestionsDropdownItem[] = fourUniqueSuggestions.map((suggestion) => {
      const icon = iconRecord[suggestion.type] || <ASSET_ICONS.metircsAdd />;
      return {
        type: 'item',
        value: suggestion.type + suggestion.value,
        label: suggestion.value,
        icon,
      };
    });

    return [
      {
        type: 'group',
        label: 'Shortcuts',
        suggestionItems: items,
        addValueToInput: true,
        closeOnSelect: true,
      },
    ] satisfies MentionInputSuggestionsProps['suggestionItems'];
  }, [suggestedPrompts]);
};

const useShortcuts = (
  shortcuts: ListShortcutsResponse['shortcuts'],
  setOpenCreateShortcutModal: (open: boolean) => void,
  onChangeValue: MentionInputSuggestionsRef['onChangeValue'] | undefined
): MentionInputSuggestionsProps['suggestionItems'] => {
  return useMemo(() => {
    const shortcutsItems = shortcuts.map<MentionInputSuggestionsDropdownItem>((shortcut) => {
      return {
        type: 'item',
        value: shortcut.name,
        label: shortcut.name,
        icon: '/',
        inputValue: `/ ${shortcut.name}`,
        onClick: () => {
          onChangeValue?.(shortcut.name);
        },
      };
    });

    shortcutsItems.push({
      type: 'item',
      value: 'createShortcut',
      label: 'Create shortcut',
      icon: <Plus />,
      inputValue: '/ Create shortcut',
      onClick: () => {
        setOpenCreateShortcutModal(true);
      },
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
  }, [shortcuts]);
};
