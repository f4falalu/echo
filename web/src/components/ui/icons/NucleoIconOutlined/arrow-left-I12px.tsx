import React from 'react';

import { iconProps } from './iconProps';

function arrowLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow left';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11 6L1.25 6"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 2.75L1 6 4.25 9.25"
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

export default arrowLeft;
