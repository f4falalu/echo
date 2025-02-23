import React from 'react';
import { iconProps } from './iconProps';

function I12px_paperPlane4(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px paper plane 4';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M2.093 6L5.25 6"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.799,6.739L2.197,11.156c-.639.328-1.366-.255-1.183-.951l1.051-3.994c.036-.139.036-.284,0-.423L1.014,1.795c-.183-.695.543-1.279,1.183-.951l8.602,4.417c.602.309.602,1.169,0,1.478Z"
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

export default I12px_paperPlane4;
