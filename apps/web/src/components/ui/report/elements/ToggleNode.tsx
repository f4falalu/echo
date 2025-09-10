import { useToggleButton, useToggleButtonState } from '@platejs/toggle/react';
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
  const prevOpenRef = React.useRef(open);

  React.useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (!wasOpen && open) {
      type Child = { type?: string; text?: string };
      const children = (element.children ?? []) as Child[];

      const hasBlockChildren = children.some((c) => typeof c.type === 'string');
      const hasNonEmptyText = children.some(
        (c) => typeof c.text === 'string' && c.text.trim().length > 0
      );

      if (!hasBlockChildren && !hasNonEmptyText) {
        const path = editor.api.findPath(element);
        if (path) {
          const newParagraph = editor.api.create.block();
          editor.tf.insertNodes(newParagraph, {
            at: path.concat(children.length),
            select: true,
          });
        }
      }
    }
  }, [editor, element, open]);

  const hasContent = element.children.some((child) => child.text);

  return (
    <PlateElement {...props} className="pl-6 my-2">
      <Button
        size="small"
        variant="ghost"
        className="absolute top-0 -left-0.5 size-6 cursor-pointer items-center justify-center rounded-md p-px text-muted-foreground transition-colors select-none hover:bg-accent [&_svg]:size-4"
        contentEditable={false}
        {...buttonProps}
        prefix={
          <div className={cn('transition-transform duration-100', open ? 'rotate-90' : 'rotate-0')}>
            <ChevronRight />
          </div>
        }
      />
      {!hasContent && (
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
