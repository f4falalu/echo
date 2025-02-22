import React from 'react';
import { iconProps } from './iconProps';

function toggle2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px toggle 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m6.5,3.75h5c2.8995,0,5.25,2.3505,5.25,5.25h0c0,2.8995-2.3505,5.25-5.25,5.25h-5c-2.8995,0-5.25-2.3505-5.25-5.25h0c0-2.8995,2.3505-5.25,5.25-5.25Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="6.5"
          cy="9"
          fill={secondaryfill}
          r="1.75"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default toggle2;
