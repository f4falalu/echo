import React from 'react';

import { iconProps } from './iconProps';

function arrowDotRotateAnticlockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow dot rotate anticlockwise';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle
          cx="2.75"
          cy="9.25"
          fill="none"
          r="1.5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.282,3.694C2.136,1.951,3.928.75,6,.75c2.899,0,5.25,2.351,5.25,5.25s-2.351,5.25-5.25,5.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 3.75L1.25 3.75 1.25 0.75"
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

export default arrowDotRotateAnticlockwise;
