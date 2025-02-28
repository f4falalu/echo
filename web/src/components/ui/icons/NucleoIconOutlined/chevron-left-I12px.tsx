import React from 'react';

import { iconProps } from './iconProps';

function chevronLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chevron left';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.75 1.75L3.5 6 7.75 10.25"
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

export default chevronLeft;
