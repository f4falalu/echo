import React from 'react';
import { iconProps } from './iconProps';

function headphones4(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px headphones 4';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m15.75,12.75v-3.75c0-3.7279-3.0221-6.75-6.75-6.75h0c-3.7279,0-6.75,3.0221-6.75,6.75v3.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2.25,12.75h0c0,1.6569,1.3431,3,3,3h0c.5523,0,1-.4477,1-1v-4c0-.5523-.4477-1-1-1h0c-1.6569,0-3,1.3431-3,3Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m12.75,9.75h0c-.5523,0-1,.4477-1,1v4c0,.5523.4477,1,1,1h0c1.6569,0,3-1.3431,3-3h0c0-1.6569-1.3431-3-3-3Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default headphones4;
