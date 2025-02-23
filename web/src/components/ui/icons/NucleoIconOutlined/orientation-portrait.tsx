import React from 'react';
import { iconProps } from './iconProps';

function orientationPortrait(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px orientation portrait';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M2.75 13.25L2.75 5"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M0.75 6.75L2.75 4.75 4.75 6.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.135,11.5c.895,0,1.276-.599,1.006-1.087-.466-.842-1.359-1.413-2.391-1.413s-1.925,.571-2.391,1.413c-.27,.487,.112,1.087,.669,1.087h3.107Z"
          fill={secondaryfill}
        />
        <rect
          height="12.5"
          width="9"
          fill="none"
          rx="2"
          ry="2"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.25"
          y="2.75"
        />
        <circle cx="11.75" cy="7.25" fill={secondaryfill} r="1.25" />
      </g>
    </svg>
  );
}

export default orientationPortrait;
