import { indent } from '@platejs/indent';
import { buildToggleIndex, useToggleButton, useToggleButtonState } from '@platejs/toggle/react';
import { KEYS } from 'platejs';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement, useEditorRef, useElement, useElementSelector } from 'platejs/react';
import * as React from 'react';
import { Button } from '@/components/ui/buttons';
import { ChevronRight } from '@/components/ui/icons';
import { cn } from '@/lib/classMerge';

export function ToggleElement(props: PlateElementProps) {
  const element = props.element;
  const state = useToggleButtonState(element.id as string);
  const { buttonProps, open } = useToggleButton(state);
  const editor = useEditorRef();

  const toggleParentHasContent = element.children.some((child) => child.text);
  const hasContent = useToggleHasContent(element.id as string);

  React.useEffect(() => {
    if (open && !hasContent) {
      // Find the path of the current toggle element
      const togglePath = editor.api.findPath(element);

      if (togglePath) {
        // Insert a paragraph after the toggle element
        const paragraphPath = [togglePath[0] + 1];
        const paragraphNode = {
          type: KEYS.p,
          children: [{ text: '' }],
        };

        editor.tf.withoutNormalizing(() => {
          editor.tf.insertNodes(paragraphNode, { at: paragraphPath });
          // Select the paragraph after insertion
          const endPoint = {
            path: [...paragraphPath, 0],
            offset: 0,
          };
          editor.tf.select(endPoint);
          // Apply indentation to make it part of the toggle's content
          indent(editor);
        });
      }
    }
  }, [open, hasContent, editor, element]);

  return (
    <PlateElement {...props} className="pl-6 my-2">
      <Button
        size="small"
        variant="ghost"
        className="absolute top-0 -left-0.5 size-6 cursor-pointer items-center justify-center rounded p-px text-muted-foreground transition-colors select-none hover:bg-accent [&_svg]:size-4"
        contentEditable={false}
        {...buttonProps}
        prefix={
          <div className={cn('transition-transform duration-100', open ? 'rotate-90' : 'rotate-0')}>
            <ChevronRight />
          </div>
        }
      />
      {!toggleParentHasContent && (
        <span
          contentEditable={false}
          className="absolute top-0 left-6.5 select-none text-text-tertiary pointer-events-none"
        >
          Type here...
        </span>
      )}
      {props.children}
    </PlateElement>
  );
}

function useToggleHasContent(toggleId: string): boolean {
  const editor = useEditorRef();

  return React.useMemo(() => {
    const toggleIndex = buildToggleIndex(editor.children);

    // Check if any elements are enclosed within this toggle
    for (const [_elementId, enclosingToggleIds] of toggleIndex.entries()) {
      if (enclosingToggleIds.includes(toggleId)) {
        return true;
      }
    }

    return false;
  }, [editor.children, toggleId]);
}
