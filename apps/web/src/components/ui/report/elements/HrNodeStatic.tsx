import type { SlateElementProps } from 'platejs';
import { SlateElement } from 'platejs';
import * as React from 'react';

import { cn } from '@/lib/utils';

export function HrElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div className="cursor-text py-6" contentEditable={false}>
        <hr className={cn('border-border border-0 border-t')} />
      </div>
      {props.children}
    </SlateElement>
  );
}
