import React from 'react';

import { iconProps } from './iconProps';

function decentralize(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px decentralize';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle
          cx="9"
          cy="6.5"
          fill="none"
          r="1.75"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="14.75"
          fill="none"
          r="1.5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="3.25"
          cy="13.75"
          fill="none"
          r="1.5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14.75"
          cy="13.75"
          fill="none"
          r="1.5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25,6.5c0-2.623,2.127-4.75,4.75-4.75s4.75,2.127,4.75,4.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.378,8.705l-1.168,.711c-.596,.363-.96,1.01-.96,1.708v1.126"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.622,8.705l1.168,.711c.596,.363,.96,1.01,.96,1.708v1.126"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 10.75L9 13.25"
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

export default decentralize;
