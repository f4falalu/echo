import { ClientOnly } from '@tanstack/react-router';
import Document from '@tiptap/extension-document';
import Mention, { type MentionOptions } from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import {
  EditorContent,
  EditorContext,
  posToDOMRect,
  ReactRenderer,
  useEditor,
} from '@tiptap/react';
import React, { useMemo } from 'react';
import { createMentionSuggestionExtension } from './createMentionSuggestionOption';
import {
  MentionList,
  type MentionListImperativeHandle,
  type MentionListProps,
} from './MentionList/MentionList';

const atSuggestion = createMentionSuggestionExtension({
  trigger: '@',
  items: [
    { value: 'Lea Thompson', label: 'Lea Thompson' },
    { value: 'Cyndi Lauper', label: 'Cyndi Lauper' },
    { value: 'Tom Cruise', label: 'Tom Cruise' },
    { value: 'Madonna', label: 'Madonna' },
  ],
});

export const MentionInput = () => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Mention.configure({
        HTMLAttributes: {
          class: 'text-gray-dark bg-item-select border rounded p-0.5',
        },
        suggestions: [atSuggestion],
      }),
    ],
    content: '',
    autofocus: true,
    editable: true,
  });

  const providerValue = useMemo(() => ({ editor }), [editor]);

  return (
    <ClientOnly>
      <EditorContext.Provider value={providerValue}>
        <EditorContent className="rounded border min-w-120 focus:outline-none" editor={editor} />
      </EditorContext.Provider>
    </ClientOnly>
  );
};
