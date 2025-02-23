import React from 'react';
import { iconProps } from './iconProps';

function babyCarriage(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px baby carriage';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9.75,7.75V1.75h0c3.038,0,5.5,2.462,5.5,5.5v.5"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,7.75H15.25v2c0,1.656-1.344,3-3,3H6.75c-1.656,0-3-1.344-3-3v-2h0Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,4.75h.5c.828,0,1.5,.672,1.5,1.5v1.5"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.25" cy="15.75" fill={secondaryfill} r="1.25" />
        <circle cx="13.75" cy="15.75" fill={secondaryfill} r="1.25" />
      </g>
    </svg>
  );
}

export default babyCarriage;
