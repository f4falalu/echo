import { posToDOMRect, ReactRenderer } from '@tiptap/react';
import { defaultQueryMentionsFilter } from './defaultQueryMentionsFilter';
import type {
  MentionInputTriggerItem,
  MentionSuggestionExtension,
  MentionTriggerItem,
} from './MentionInput.types';
import {
  MentionList,
  type MentionListImperativeHandle,
  type MentionListProps,
} from './MentionList';

export const createMentionSuggestionExtension = ({
  trigger,
  items,
}: {
  trigger: string;
  items: MentionInputTriggerItem[] | ((props: { query: string }) => MentionInputTriggerItem[]); //if no function is provided we will use a literal string match
}): MentionSuggestionExtension => ({
  char: '@',
  items:
    typeof items === 'function' ? items : ({ query }) => defaultQueryMentionsFilter(query, items),
  render: () => {
    let component: ReactRenderer<MentionListImperativeHandle, MentionListProps<string>>;

    return {
      onStart: (props) => {
        const { editor } = props;
        component = new ReactRenderer(
          MentionList as React.ComponentType<MentionListProps<string>>,
          { props, editor: props.editor }
        );

        if (!props.clientRect) {
          console.warn('No client rect for mention suggestion');
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
        //DO I need to make an update position here?
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
});
