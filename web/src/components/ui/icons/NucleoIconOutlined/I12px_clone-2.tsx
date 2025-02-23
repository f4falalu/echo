import React from 'react';
import { iconProps } from './iconProps';

function I12px_clone2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px clone 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m3.667,8.25h-1.417c-.828,0-1.5-.672-1.5-1.5V2.25c0-.828.672-1.5,1.5-1.5h4.5c.828,0,1.5.672,1.5,1.5v1.5"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="7.5"
          width="7.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 7.5 7.5)"
          x="3.75"
          y="3.75"
        />
      </g>
    </svg>
  );
}

export default I12px_clone2;
