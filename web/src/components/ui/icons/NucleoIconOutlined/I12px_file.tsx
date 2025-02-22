import React from 'react';
import { iconProps } from './iconProps';

function I12px_file(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px file';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m6.75,4.25h3.5c0-.321-.127-.627-.353-.853l-2.295-2.295c-.226-.226-.532-.353-.851-.353v3.5Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="M6.75 0.75L6.75 4.25 10.25 4.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.603,1.103l2.294,2.294c.226.226.353.532.353.852v5.001c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V2.75C1.75,1.645,2.645.75,3.75.75h3.001c.32,0,.626.127.852.353Z"
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

export default I12px_file;
