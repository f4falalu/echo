import React from 'react';
import { iconProps } from './iconProps';

function storage(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px storage';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <ellipse
          cx="9"
          cy="5.5"
          fill="none"
          rx="6.25"
          ry="3.25"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.193,9.442c-.415,1.586-3.029,2.808-6.193,2.808-3.163,0-5.778-1.222-6.193-2.808"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.193,12.942c-.415,1.586-3.029,2.808-6.193,2.808-3.163,0-5.778-1.222-6.193-2.808"
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

export default storage;
