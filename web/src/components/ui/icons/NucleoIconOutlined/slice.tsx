import React from 'react';
import { iconProps } from './iconProps';

function slice(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px slice';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M10.206,6.294L1.25,15.25c3.344,.25,6.125-.781,7.75-2.5l-.253-1.702,1.546-1.546"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.206,6.294l3.578-3.578c.621-.621,1.629-.621,2.25,0h0c.621,.621,.621,1.629,0,2.25l-3.578,3.578-2.25-2.25Z"
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

export default slice;
