import React from 'react';

import { iconProps } from './iconProps';

function dots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="currentColor"
          r=".5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="3.25"
          cy="9"
          fill="currentColor"
          r=".5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14.75"
          cy="9"
          fill="currentColor"
          r=".5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default dots;
