import React from 'react';
import { iconProps } from './iconProps';

function I12px_circleHalfDottedCheck(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px circle half dotted check';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m6,.75c2.899,0,5.25,2.351,5.25,5.25s-2.351,5.25-5.25,5.25"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.747 6.5L5.25 8 8.253 4"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="3.375" cy="1.453" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="1.453" cy="3.375" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx=".75" cy="6" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="1.453" cy="8.625" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="3.375" cy="10.547" fill={secondaryfill} r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default I12px_circleHalfDottedCheck;
