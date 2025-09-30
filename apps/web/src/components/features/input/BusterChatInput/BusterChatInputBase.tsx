import type { ListShortcutsResponse } from '@buster/server-shared/shortcuts';
import type { GetSuggestedPromptsResponse } from '@buster/server-shared/user';
import sampleSize from 'lodash/sampleSize';
import React, { useMemo, useRef, useState } from 'react';
import {
  useCreateShortcutsMentionsSuggestions,
  useShortcutsSuggestions,
} from '@/components/features/input/Mentions/ShortcutsSuggestions/ShortcutsSuggestions';
import CircleQuestion from '@/components/ui/icons/NucleoIconOutlined/circle-question';
import FileSparkle from '@/components/ui/icons/NucleoIconOutlined/file-sparkle';
import type {
  MentionArrayItem,
  MentionSuggestionExtension,
} from '@/components/ui/inputs/MentionInput';
import type {
  MentionInputSuggestionsDropdownItem,
  MentionInputSuggestionsProps,
  MentionInputSuggestionsRef,
} from '@/components/ui/inputs/MentionInputSuggestions';
import { MentionInputSuggestions } from '@/components/ui/inputs/MentionInputSuggestions';
import { useMount } from '@/hooks/useMount';
import { ASSET_ICONS } from '../../icons/assetIcons';
import { NewShortcutModal } from '../../modals/NewShortcutModal';
import { BusterChatInputButtons, type BusterChatInputMode } from './BusterChatInputButtons';

export type BusterChatInputProps = {
  defaultValue: string;
  onSubmit: (d: {
    transformedValue: string;
    arrayValue: MentionArrayItem[];
    editorText: string;
    mode: BusterChatInputMode;
  }) => void;
  onStop: () => void;
  submitting: boolean;
  disabled: boolean;
  shortcuts: ListShortcutsResponse['shortcuts'];
  suggestedPrompts: GetSuggestedPromptsResponse['suggestedPrompts'];
  autoSubmit?: boolean;
};

export const BusterChatInputBase: React.FC<BusterChatInputProps> = React.memo(
  ({
    defaultValue,
    onSubmit,
    onStop,
    autoSubmit,
    submitting,
    disabled,
    shortcuts,
    suggestedPrompts,
  }) => {
    const mentionInputSuggestionsRef = useRef<MentionInputSuggestionsRef>(null);
    const uniqueSuggestions = useUniqueSuggestions(suggestedPrompts);
    const [openCreateShortcutModal, setOpenCreateShortcutModal] = useState(false);
    const [mode, setMode] = useState<BusterChatInputMode>('auto');

    const shortcutsSuggestions = useShortcutsSuggestions(
      shortcuts,
      setOpenCreateShortcutModal,
      mentionInputSuggestionsRef
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

    const onSubmitPreflight = (valueProp?: ReturnType<MentionInputSuggestionsRef['getValue']>) => {
      if (submitting) {
        console.warn('Input is submitting');
        return;
      }

      const value = valueProp || mentionInputSuggestionsRef.current?.getValue?.();
      if (!value) {
        console.warn('Value is not defined');
        return;
      }

      if (disabled || !value) {
        console.warn('Input is disabled or value is not defined');
        return;
      }
      onSubmit({ ...value, mode });
    };

    useMount(() => {
      if (autoSubmit && defaultValue) {
        onSubmitPreflight({
          transformedValue: defaultValue,
          arrayValue: [],
          editorText: defaultValue,
        });
      }
    });

    return (
      <React.Fragment>
        <MentionInputSuggestions
          defaultValue={defaultValue}
          onPressEnter={onSubmitPreflight}
          mentions={mentions}
          suggestionItems={suggestionItems}
          placeholder="Ask a question or type ‘/’ for shortcuts..."
          ref={mentionInputSuggestionsRef}
        >
          <BusterChatInputButtons
            onSubmit={onSubmitPreflight}
            onStop={onStop}
            submitting={submitting}
            disabled={disabled}
            mode={mode}
            onModeChange={setMode}
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
