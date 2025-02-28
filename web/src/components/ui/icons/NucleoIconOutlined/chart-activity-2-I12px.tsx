import React from 'react';

import { iconProps } from './iconProps';

function chartActivity2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chart activity 2';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,5.75h-2.25l-1.5,4.5L4.5,1.75l-1.5,4.5H.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default chartActivity2;
