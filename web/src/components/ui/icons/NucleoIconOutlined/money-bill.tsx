import React from 'react';

import { iconProps } from './iconProps';

function moneyBill(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px money bill';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="2"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="4.25" cy="9" fill="currentColor" r=".75" />
        <circle cx="13.75" cy="9" fill="currentColor" r=".75" />
        <rect
          height="10.5"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="3.75"
        />
      </g>
    </svg>
  );
}

export default moneyBill;
