import React from 'react';

import { iconProps } from './iconProps';

function gridLayoutRows(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px grid layout rows';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="9.5"
          width="3.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 6 3)"
          x="4.25"
          y="-1.75"
        />
        <rect
          height="9.5"
          width="3.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 6 9)"
          x="4.25"
          y="4.25"
        />
      </g>
    </svg>
  );
}

export default gridLayoutRows;
