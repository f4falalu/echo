import React from 'react';
import { iconProps } from './iconProps';

function fxBlur(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px fx blur-sm';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="6.5" cy="2" fill={secondaryfill} r="1" />
        <circle cx="11.5" cy="2" fill={secondaryfill} r="1" />
        <circle cx="16" cy="6.5" fill={secondaryfill} r="1" />
        <circle cx="16" cy="11.5" fill={secondaryfill} r="1" />
        <circle cx="11.5" cy="16" fill={secondaryfill} r="1" />
        <circle cx="6.5" cy="16" fill={secondaryfill} r="1" />
        <circle cx="2" cy="11.5" fill={secondaryfill} r="1" />
        <circle cx="2" cy="6.5" fill={secondaryfill} r="1" />
        <circle
          cx="6.5"
          cy="6.5"
          fill="none"
          r="1.25"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="11.5"
          cy="6.5"
          fill="none"
          r="1.25"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="6.5"
          cy="11.5"
          fill="none"
          r="1.25"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="11.5"
          cy="11.5"
          fill="none"
          r="1.25"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default fxBlur;
