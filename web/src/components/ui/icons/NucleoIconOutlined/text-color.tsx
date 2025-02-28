import React from 'react';

import { iconProps } from './iconProps';

function textColor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text color';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.57 10.25L9.273 1.75 8.727 1.75 5.43 10.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.4 7.75L11.6 7.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3.5"
          width="14.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="12.75"
        />
      </g>
    </svg>
  );
}

export default textColor;
