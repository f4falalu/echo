import React from 'react';

import { iconProps } from './iconProps';

function dice2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dice 2';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
        <circle cx="11" cy="11" fill="currentColor" r="1" />
        <circle cx="7" cy="7" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default dice2;
