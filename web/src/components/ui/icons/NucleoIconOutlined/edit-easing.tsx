import React from 'react';

import { iconProps } from './iconProps';

function editEasing(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px edit easing';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11 4.75L6 4.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7 13.25L12 13.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,4.75c4.75,0,1.75,8.5,6.5,8.5"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="12.5" cy="4.75" fill="currentColor" r="1.5" />
        <circle cx="5.5" cy="13.25" fill="currentColor" r="1.5" />
        <rect
          height="4"
          width="4"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="2.75"
        />
        <rect
          height="4"
          width="4"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="12.25"
          y="11.25"
        />
      </g>
    </svg>
  );
}

export default editEasing;
