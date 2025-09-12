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
import type { SuggestionOptions } from '@tiptap/suggestion';
import React, { useMemo } from 'react';
import {
  MentionList,
  type MentionListImperativeHandle,
  type MentionListProps,
} from './MentionList';

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
        suggestions: [
          {
            char: '@',
            items: ({ query }) => {
              return ['Lea Thompson', 'Cyndi Lauper', 'Tom Cruise', 'Madonna'];
            },
            render: () => {
              let component: ReactRenderer<MentionListImperativeHandle, MentionListProps<string>>;

              return {
                onStart: (props) => {
                  component = new ReactRenderer(
                    MentionList as React.ComponentType<MentionListProps<string>>,
                    {
                      props,
                      editor: props.editor,
                    }
                  );

                  if (!props.clientRect) {
                    return;
                  }

                  const rect = posToDOMRect(
                    editor.view,
                    editor.state.selection.from,
                    editor.state.selection.to
                  );

                  const element = component.element as HTMLElement;
                  element.style.position = 'absolute';
                  element.style.left = `${rect.left}px`;
                  element.style.top = `${rect.top}px`;
                  element.style.transform = `translateY(1.0lh)`;

                  document.body.appendChild(component.element);
                },

                onUpdate(props) {
                  component.updateProps(props);
                  //  updatePosition(props.editor, component.element);
                },

                onKeyDown(props) {
                  if (props.event.key === 'Escape') {
                    component.destroy();
                    return true;
                  }

                  return component.ref?.onKeyDown(props) ?? false;
                },

                onExit() {
                  component.element.remove();
                  component.destroy();
                },
              };
            },
          },
        ],
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
