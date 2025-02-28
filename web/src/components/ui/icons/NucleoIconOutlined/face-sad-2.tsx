import React from 'react';

import { iconProps } from './iconProps';

function faceSad2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face sad 2';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
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
        <circle cx="6" cy="9" fill="currentColor" r="1" />
        <circle cx="12" cy="9" fill="currentColor" r="1" />
        <path
          d="M6.75,13c.472-.746,1.304-1.242,2.25-1.242s1.778,.496,2.25,1.242"
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

export default faceSad2;
