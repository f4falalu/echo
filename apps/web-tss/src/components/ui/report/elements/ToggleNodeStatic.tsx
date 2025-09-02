import type { SlateElementProps } from 'platejs';
import { SlateElement } from 'platejs';
import * as React from 'react';
import { ChevronRight } from '@/components/ui/icons';

export function ToggleElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} className="pl-6">
      <div
        className="text-muted-foreground hover:bg-accent absolute top-0 -left-0.5 size-6 cursor-pointer items-center justify-center rounded-md p-px transition-colors select-none [&_svg]:size-4"
        contentEditable={false}
      >
        <div className="rotate-0 transition-transform duration-75">
          <ChevronRight />
        </div>
      </div>
      {props.children}
    </SlateElement>
  );
}
