import React from 'react';

import { iconProps } from './iconProps';

function followObjDownRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px follow obj down right';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M1.018 1.018L5.073 5.073"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.5 5.25L5.25 5.25 5.25 1.5"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="4.5"
          width="4.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 9 9)"
          x="6.75"
          y="6.75"
        />
      </g>
    </svg>
  );
}

export default followObjDownRight;
