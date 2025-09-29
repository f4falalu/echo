import { ClientOnly } from '@tanstack/react-router';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MentionExtension } from './MentionExtension';
import type {
  MentionInputProps,
  MentionInputRef,
  MentionSuggestionExtension,
} from './MentionInput.types';
import { SubmitOnEnter } from './SubmitEnterExtension';
import { onUpdateTransformer } from './update-transformers';

export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(
  (
    {
      mentions,
      onChange,
      defaultValue = '',
      onFocus,
      onBlur,
      autoFocus,
      style,
      className,
      readOnly,
      disabled,
      onPressEnter,
      commandListNavigatedRef,
    },
    ref
  ) => {
    const mentionsByTrigger = useMemo(() => {
      return mentions.reduce(
        (acc, mention) => {
          if (mention.char) {
            acc[mention.char] = mention;
          }
          return acc;
        },
        {} as Record<string, MentionSuggestionExtension>
      );
    }, [mentions]);

    const editor = useEditor({
      extensions: [
        Document,
        Paragraph,
        Text,
        MentionExtension(mentions),
        SubmitOnEnter({
          mentionsByTrigger,
          onPressEnter,
          commandListNavigatedRef,
        }),
      ],
      content: defaultValue,
      autofocus: autoFocus,
      editable: !disabled && !readOnly,
      editorProps: {
        attributes: {
          class: cn('p-1 border rounded outline-0', className),
        },
      },
      onUpdate: ({ editor }) => {
        const { transformedValue, transformedJson, editorText } = onUpdateTransformer({
          editor,
          mentionsByTrigger,
        });
        onChange?.(transformedValue, transformedJson, editorText);
      },
      onFocus: onFocus,
      onBlur: onBlur,
    });

    useImperativeHandle(
      ref,
      () => ({
        editor,
      }),
      [editor]
    );

    const providerValue = useMemo(() => ({ editor }), [editor]);

    return (
      <ClientOnly>
        <EditorContext.Provider value={providerValue}>
          <EditorContent className="outline-0" editor={editor} style={style} />
        </EditorContext.Provider>
      </ClientOnly>
    );
  }
);

MentionInput.displayName = 'MentionInput';
