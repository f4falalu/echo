import type { Editor, NodeType, TextType } from '@tiptap/react';
import type { MentionArrayItem, MentionSuggestionExtension } from './MentionInput.types';
import type { MentionPillAttributes } from './MentionPill';

export const onUpdateTransformer = ({
  editor,
  mentionsByTrigger,
}: {
  editor: Editor;
  mentionsByTrigger: Record<string, MentionSuggestionExtension>;
}) => {
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

  return {
    transformedValue,
    transformedJson,
    editorText,
  };
};
