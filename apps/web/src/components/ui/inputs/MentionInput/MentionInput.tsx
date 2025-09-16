import { ClientOnly } from '@tanstack/react-router';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import { useMemo } from 'react';
import { MentionExtension } from './MentionExtension';

export const MentionInput = () => {
  const editor = useEditor({
    extensions: [Document, Paragraph, Text, MentionExtension],
    content: '',
    autofocus: true,
    editorProps: {
      attributes: {
        class: 'p-1',
      },
    },
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
