import React from 'react';
import { iconProps } from './iconProps';

function crown(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px crown';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="9" cy="2.25" fill={secondaryfill} r="1" />
        <circle cx="2" cy="5" fill={secondaryfill} r="1" />
        <circle cx="16" cy="5" fill={secondaryfill} r="1" />
        <path
          d="M14.155,11.937l.845-4.437-3.25,2-2.75-4.5-2.75,4.5-3.25-2,.845,4.437c.09,.472,.502,.813,.982,.813H13.172c.48,0,.892-.341,.982-.813Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14 15.25L4 15.25"
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

export default crown;
