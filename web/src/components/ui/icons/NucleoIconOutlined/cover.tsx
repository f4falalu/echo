import React from 'react';

import { iconProps } from './iconProps';

function cover(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cover';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="12.5"
          width="13.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.25"
          y="2.75"
        />
        <path
          d="M5.25 5.75H12.75V8.75H5.25z"
          fill="currentColor"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default cover;
