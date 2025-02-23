import React from 'react';
import { iconProps } from './iconProps';

function sparkle2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px sparkle 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M4.75 10.25L5.6 12.4 7.75 13.25 5.6 14.1 4.75 16.25 3.9 14.1 1.75 13.25 3.9 12.4 4.75 10.25z"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 1.75L12.667 5.333 16.25 6.75 12.667 8.167 11.25 11.75 9.833 8.167 6.25 6.75 9.833 5.333 11.25 1.75z"
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

export default sparkle2;
