import React from 'react';
import { iconProps } from './iconProps';

function chartScatter(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px chart scatter';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M2.75,2.75V12.75c0,1.105,.895,2,2,2H15.25"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="11" fill={secondaryfill} r="1" />
        <circle cx="7" cy="7" fill={secondaryfill} r="1" />
        <circle cx="10.5" cy="9" fill={secondaryfill} r="1" />
        <circle cx="11" cy="5" fill={secondaryfill} r="1" />
        <circle cx="14" cy="10.5" fill={secondaryfill} r="1" />
      </g>
    </svg>
  );
}

export default chartScatter;
