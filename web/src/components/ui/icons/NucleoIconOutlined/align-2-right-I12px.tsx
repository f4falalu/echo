import React from 'react';

import { iconProps } from './iconProps';

function align2Right(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px align 2 right';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.25 0.75L11.25 11.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="7.5"
          width="4.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 4.5 6)"
          x="2.25"
          y="2.25"
        />
      </g>
    </svg>
  );
}

export default align2Right;
