import { ClientOnly } from '@tanstack/react-router';
import Document from '@tiptap/extension-document';
import type { MentionNodeAttrs } from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import {
  EditorContent,
  EditorContext,
  type EditorEvents,
  type NodeType,
  type TextType,
  useEditor,
} from '@tiptap/react';
import { useMemo } from 'react';
import { MentionExtension } from './MentionExtension';
import type {
  MentionArrayItem,
  MentionOnChangeParams,
  MentionSuggestionExtension,
} from './MentionInput.types';
import type { MentionPillAttributes } from './MentionPill';

export const MentionInput = ({
  mentions,
  onChange,
  defaultValue = '',
  onFocus,
  onBlur,
}: {
  mentions: MentionSuggestionExtension[];
  onChange?: MentionOnChangeParams;
  onFocus?: (v: EditorEvents['focus']) => void;
  onBlur?: (v: EditorEvents['blur']) => void;
  defaultValue?: string;
}) => {
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
    extensions: [Document, Paragraph, Text, MentionExtension(mentions)],
    content: defaultValue,
    autofocus: true,
    editorProps: {
      attributes: {
        class: 'p-1',
      },
    },
    onUpdate: ({ editor }) => {
      const editorText = editor.getText();
      const editorJson = editor.getJSON();
      const transformedJson: MentionArrayItem[] = editorJson.content.reduce<MentionArrayItem[]>(
        (acc, item) => {
          if (item.type === 'paragraph') {
            item.content?.forEach((item) => {
              if (item.type === 'text') {
                const _item = item as TextType;
                acc.push({ type: 'text', text: _item.text });
              } else if (item.type === 'mention') {
                const _item = item as NodeType<'mention', MentionPillAttributes>;
                acc.push({ type: 'mention', attrs: _item.attrs });
              }
            });
          }
          return acc;
        },
        []
      );
      const transformedValue = transformedJson.reduce((acc, item) => {
        if (item.type === 'text') {
          return acc + item.text;
        }
        if (item.type === 'mention') {
          const onChangeTransform = mentionsByTrigger[item.attrs.trigger]?.onChangeTransform;
          if (onChangeTransform) return acc + onChangeTransform(item.attrs);
          return acc + item.attrs.label;
        }
        return acc;
      }, '');
      onChange?.(transformedValue, transformedJson, editorText);
    },
    onFocus: onFocus,
    onBlur: onBlur,
  });

  const providerValue = useMemo(() => ({ editor }), [editor]);

  return (
    <ClientOnly>
      <EditorContext.Provider value={providerValue}>
        <EditorContent className="rounded p-1 border outline-1 min-w-120" editor={editor} />
      </EditorContext.Provider>
    </ClientOnly>
  );
};
