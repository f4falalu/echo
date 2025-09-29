import type { ListShortcutsResponse } from '@buster/server-shared/shortcuts';
import type { GetSuggestedPromptsResponse } from '@buster/server-shared/user';
import sampleSize from 'lodash/sampleSize';
import React, { useMemo, useRef, useState } from 'react';
import { createShortcutsMentionsSuggestions } from '@/components/features/input/Mentions/ShortcutsSuggestions/ShortcutsSuggestions';
import { Plus } from '@/components/ui/icons';
import type { MentionSuggestionExtension } from '@/components/ui/inputs/MentionInput';
import type {
  MentionInputSuggestionsDropdownItem,
  MentionInputSuggestionsProps,
  MentionInputSuggestionsRef,
} from '@/components/ui/inputs/MentionInputSuggestions';
import { MentionInputSuggestions } from '@/components/ui/inputs/MentionInputSuggestions';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
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
    const shortcutsSuggestions = useShortcuts(shortcuts);

    const [mode, setMode] = useState<BusterChatInputMode>('auto');

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

    const mentions: MentionSuggestionExtension[] = useMemo(() => {
      return [createShortcutsMentionsSuggestions(shortcuts)];
    }, [shortcuts]);

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

    const onStopPreflight = useMemoizedFn(() => {
      onStop();
    });

    const onPressEnter: MentionInputSuggestionsProps['onPressEnter'] = useMemoizedFn(
      (value, _editorObjects, _rawText) => {
        //  onSubmitPreflight(value);
      }
    );

    const onSubmitButton = useMemoizedFn(() => {
      const value = mentionInputSuggestionsRef.current?.getValue();
      if (value) {
        onSubmitPreflight(value.transformedValue);
      }
    });

    return (
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
    );
  }
);

BusterChatInputBase.displayName = 'BusterChatInputBase';

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

    const items: MentionInputSuggestionsProps['suggestionItems'] = fourUniqueSuggestions.map(
      (suggestion) => ({
        type: 'item',
        value: suggestion.type + suggestion.value,
        label: suggestion.value,
      })
    );

    return items;
  }, [suggestedPrompts]);
};

const useShortcuts = (
  shortcuts: ListShortcutsResponse['shortcuts']
): MentionInputSuggestionsProps['suggestionItems'] => {
  return useMemo(() => {
    const shortcutsItems = shortcuts.map<MentionInputSuggestionsDropdownItem>((shortcut) => {
      return {
        type: 'item',
        value: shortcut.name,
        label: shortcut.name,
        icon: '/',
        inputValue: `/ ${shortcut.name}`,
      };
    });

    shortcutsItems.push({
      type: 'item',
      value: 'createShortcut',
      label: 'Create shortcut',
      icon: <Plus />,
      inputValue: '/ Create shortcut',
      onClick: () => {
        console.log('createShortcut');
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
