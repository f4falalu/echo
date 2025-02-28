import React from 'react';

import { iconProps } from './iconProps';

function parkingSign(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px parking sign';

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
        <path
          d="M7.25 12.25L7.25 5.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,9.25h2.25c.966,0,1.75-.784,1.75-1.75h0c0-.967-.784-1.75-1.75-1.75h-2.25"
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

export default parkingSign;
