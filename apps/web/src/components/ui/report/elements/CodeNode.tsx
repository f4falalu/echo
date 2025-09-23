import type { PlateLeafProps } from 'platejs/react';
import { PlateLeaf } from 'platejs/react';
import * as React from 'react';

/*
This is used for inline code blocks.
*/
export function CodeLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      as="code"
      className="bg-muted rounded px-[2px] py-[0.5px] font-mono text-sm whitespace-pre-wrap border"
    >
      {props.children}
    </PlateLeaf>
  );
}
