import React from 'react';

import { iconProps } from './iconProps';

function alertInfo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px alert info';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6 10.75L6 4.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="1.5" fill="currentColor" r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default alertInfo;
