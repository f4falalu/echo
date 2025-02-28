import React from 'react';

import { iconProps } from './iconProps';

function stack2Plus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stack 2 plus';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9 12.25L9 7.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 10L6.75 10"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 1.75L13.25 1.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="10.5"
          width="13.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.25"
          y="4.75"
        />
      </g>
    </svg>
  );
}

export default stack2Plus;
