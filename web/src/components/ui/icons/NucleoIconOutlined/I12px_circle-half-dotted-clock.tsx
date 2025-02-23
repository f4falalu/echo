import React from 'react';
import { iconProps } from './iconProps';

function I12px_circleHalfDottedClock(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px circle half dotted clock';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path d="m7.282,11.093l-.009-.002.009.002Z" fill={fill} strokeWidth="0" />
        <path
          d="m6,.75c2.899,0,5.25,2.35,5.25,5.25,0,2.899-2.35,5.25-5.25,5.25"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6,3.25v2.75l2,1.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx=".75" cy="6" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="1.453" cy="3.375" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="3.375" cy="1.453" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="1.453" cy="8.625" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="3.375" cy="10.547" fill={secondaryfill} r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default I12px_circleHalfDottedClock;
