import type { ListShortcutsResponse } from '@buster/server-shared/shortcuts';
import type { GetSuggestedPromptsResponse } from '@buster/server-shared/user';
import sample from 'lodash/sample';
import sampleSize from 'lodash/sampleSize';
import React, { useMemo } from 'react';
import type { MentionSuggestionExtension } from '@/components/ui/inputs/MentionInput';
import type { MentionInputSuggestionsProps } from '@/components/ui/inputs/MentionInputSuggestions';
import { MentionInputSuggestions } from '@/components/ui/inputs/MentionInputSuggestions';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

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
    const uniqueSuggestions = useUniqueSuggestions(suggestedPrompts);
    const shortcutsSuggestions = useShortcuts(shortcuts);

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
      return [];
    }, [shortcuts]);

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

    return (
      <MentionInputSuggestions
        defaultValue={defaultValue}
        onPressEnter={onPressEnter}
        mentions={mentions}
        suggestionItems={suggestionItems}
      />
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
        value: suggestion.type,
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
    return shortcuts.map((shortcut) => {
      return {
        type: 'item',
        value: shortcut.name,
        label: shortcut.name,
      };
    });
  }, [shortcuts]);
};
