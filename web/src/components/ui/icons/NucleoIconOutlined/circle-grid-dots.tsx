import React from 'react';
import { iconProps } from './iconProps';

function circleGridDots(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px circle grid dots';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="12.125" cy="9" fill={secondaryfill} r=".75" />
        <circle cx="9" cy="9" fill={secondaryfill} r=".75" />
        <circle cx="5.875" cy="9" fill={secondaryfill} r=".75" />
        <circle cx="9" cy="5.875" fill={secondaryfill} r=".75" />
        <circle cx="9" cy="12.125" fill={secondaryfill} r=".75" />
      </g>
    </svg>
  );
}

export default circleGridDots;
