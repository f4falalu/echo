import React from 'react';

import { iconProps } from './iconProps';

function spoon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px spoon';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9 9L9 15.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="9"
          cy="5.625"
          fill="none"
          rx="2.625"
          ry="3.375"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default spoon;
