import React from 'react';

import { iconProps } from './iconProps';

function code(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px code';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.81 9.44L11.25 6 7.81 2.56"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.19 9.44L0.75 6 4.19 2.56"
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

export default code;
