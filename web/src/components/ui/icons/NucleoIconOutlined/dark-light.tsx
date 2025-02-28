import React from 'react';

import { iconProps } from './iconProps';

function darkLight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dark light';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M9,6v6c1.657,0,3-1.343,3-3s-1.343-3-3-3Z" fill="currentColor" />
        <path
          d="M9,12c-1.657,0-3-1.343-3-3s1.343-3,3-3V1.75C4.996,1.75,1.75,4.996,1.75,9s3.246,7.25,7.25,7.25v-4.25Z"
          fill="currentColor"
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default darkLight;
