import React from 'react';
import { iconProps } from './iconProps';

function I12px_border(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px border';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M1.25 1.25H10.75V10.75H1.25z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="6" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="6" cy="3.25" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="6" cy="8.75" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="3.25" cy="6" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="8.75" cy="6" fill={secondaryfill} r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default I12px_border;
