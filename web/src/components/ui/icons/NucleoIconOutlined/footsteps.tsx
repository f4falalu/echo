import React from 'react';
import { iconProps } from './iconProps';

function footsteps(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px footsteps';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M3.654,1.768c1.185-.181,2.415,.981,3.196,3.153s.006,3.758,.351,4.94c.365,1.25,1.222,3.252-.432,3.776-1.6,.507-2.104-.741-2.567-2.885-.217-1.006-2.21-2.575-2.403-4.567s.123-4.153,1.854-4.417Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.202 10.753L7.201 9.862"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.346,4.268c-1.185-.181-2.415,.981-3.196,3.153s-.006,3.758-.351,4.94c-.365,1.25-1.222,3.252,.432,3.776,1.6,.507,2.104-.741,2.567-2.885,.217-1.006,2.21-2.575,2.403-4.567s-.123-4.153-1.854-4.417Z"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.798 13.253L10.799 12.362"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default footsteps;
