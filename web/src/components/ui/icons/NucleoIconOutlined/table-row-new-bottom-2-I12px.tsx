import React from 'react';

import { iconProps } from './iconProps';

function tableRowNewBottom2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px table row new bottom 2';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="10.5"
          width="4"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 6 2.75)"
          x="4"
          y="-2.5"
        />
        <path
          d="M6 11.25L6 7.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4 9.25L8 9.25"
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

export default tableRowNewBottom2;
