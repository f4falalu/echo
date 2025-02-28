import React from 'react';

import { iconProps } from './iconProps';

function moveObjDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px move obj down';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6 6.25L6 11"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.5 8.75L6 11.25 8.5 8.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3"
          width="10.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 6 2.25)"
          x=".75"
          y=".75"
        />
      </g>
    </svg>
  );
}

export default moveObjDown;
