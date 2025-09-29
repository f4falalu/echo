import { Extension } from '@tiptap/core';
import type { MentionInputProps, MentionSuggestionExtension } from './MentionInput.types';
import { onUpdateTransformer } from './update-transformers';

export const SubmitOnEnter = ({
  onPressEnter,
  mentionsByTrigger,
}: {
  onPressEnter?: MentionInputProps['onPressEnter'];
  mentionsByTrigger: Record<string, MentionSuggestionExtension>;
}) =>
  Extension.create({
    addKeyboardShortcuts() {
      return {
        Enter: ({ editor }) => {
          console.log('Enter', onPressEnter);
          if (onPressEnter) {
            const { transformedValue, transformedJson, editorText } = onUpdateTransformer({
              editor,
              mentionsByTrigger,
            });
            onPressEnter?.(transformedValue, transformedJson, editorText);
          }
          return !!onPressEnter;
        },
        'Shift-Enter': () => this.editor.commands.newlineInCode(), // or insert a break
      };
    },
  });
