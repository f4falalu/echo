import React from 'react';
import { iconProps } from './iconProps';

function I12px_borderTopRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px border top right';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="4.417" cy="10.75" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="7.583" cy="10.75" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="1.25" cy="4.417" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="1.25" cy="7.583" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="1.25" cy="10.75" fill={secondaryfill} r=".75" strokeWidth="0" />
        <path
          d="M1.25 1.25L10.75 1.25 10.75 10.75"
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

export default I12px_borderTopRight;
