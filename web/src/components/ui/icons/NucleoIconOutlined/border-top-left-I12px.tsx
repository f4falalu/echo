import React from 'react';

import { iconProps } from './iconProps';

function borderTopLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px border top left';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="10.75" cy="7.583" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="10.75" cy="4.417" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="4.417" cy="10.75" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="7.583" cy="10.75" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="10.75" cy="10.75" fill="currentColor" r=".75" strokeWidth="0" />
        <path
          d="M1.25 10.75L1.25 1.25 10.75 1.25"
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

export default borderTopLeft;
