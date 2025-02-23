import React from 'react';
import { iconProps } from './iconProps';

function tabletMobile(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px tablet mobile';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M7,14.25h-2.25c-1.105,0-2-.895-2-2V3.75c0-1.105,.895-2,2-2h6.5c1.105,0,2,.895,2,2v1.25"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="5.5"
          width="8.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 12.5 12)"
          x="8.25"
          y="9.25"
        />
      </g>
    </svg>
  );
}

export default tabletMobile;
