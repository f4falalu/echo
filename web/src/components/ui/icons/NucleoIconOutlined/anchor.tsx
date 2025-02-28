import React from 'react';

import { iconProps } from './iconProps';

function anchor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px anchor';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,10.531l-1-1.531c0,3.452-2.798,6.25-6.25,6.25-3.452,0-6.25-2.798-6.25-6.25l-1,1.531"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 5.25L9 16.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 8.25L10.75 8.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="3.5"
          fill="none"
          r="1.75"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default anchor;
