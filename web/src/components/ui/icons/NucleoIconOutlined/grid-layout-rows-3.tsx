import React from 'react';

import { iconProps } from './iconProps';

function gridLayoutRows3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid layout rows 3';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="2.5"
          width="12.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="7.75"
        />
        <rect
          height="2.5"
          width="12.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.25"
        />
        <rect
          height="2.5"
          width="12.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="13.25"
        />
      </g>
    </svg>
  );
}

export default gridLayoutRows3;
