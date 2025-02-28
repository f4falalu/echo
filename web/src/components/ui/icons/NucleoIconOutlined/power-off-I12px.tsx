import React from 'react';

import { iconProps } from './iconProps';

function powerOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px power off';

  return (
    <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.4,2c1.132.963,1.85,2.398,1.85,4,0,2.899-2.351,5.25-5.25,5.25S.75,8.899.75,6c0-1.602.718-3.037,1.85-4"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 0.75L6 6"
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

export default powerOff;
