import React from 'react';

import { iconProps } from './iconProps';

function shapeCircle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px shape circle';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle
          cx="6"
          cy="6"
          fill="none"
          r="5.25"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default shapeCircle;
