import React from 'react';
import { iconProps } from './iconProps';

function octagonCheck(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px octagon check';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M5.75 9.25L8 11.75 12.25 6.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.968,2.25h-3.935c-.53,0-1.039,.211-1.414,.586l-2.782,2.782c-.375,.375-.586,.884-.586,1.414v3.935c0,.53,.211,1.039,.586,1.414l2.782,2.782c.375,.375,.884,.586,1.414,.586h3.935c.53,0,1.039-.211,1.414-.586l2.782-2.782c.375-.375,.586-.884,.586-1.414v-3.935c0-.53-.211-1.039-.586-1.414l-2.782-2.782c-.375-.375-.884-.586-1.414-.586Z"
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

export default octagonCheck;
