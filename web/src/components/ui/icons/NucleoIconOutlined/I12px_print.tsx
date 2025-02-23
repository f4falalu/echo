import React from 'react';
import { iconProps } from './iconProps';

function I12px_print(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px print';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m3.75,3.25v-1.5c0-.552.448-1,1-1h2.5c.552,0,1,.448,1,1v1.5"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.75,8.75h-1.5c-.828,0-1.5-.672-1.5-1.5v-2.5c0-.828.672-1.5,1.5-1.5h7.5c.828,0,1.5.672,1.5,1.5v2.5c0,.828-.672,1.5-1.5,1.5h-1.5"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.75,6.25h4.5v4c0,.552-.448,1-1,1h-2.5c-.552,0-1-.448-1-1v-4h0Z"
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

export default I12px_print;
