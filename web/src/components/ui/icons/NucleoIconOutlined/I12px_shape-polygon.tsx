import React from 'react';
import { iconProps } from './iconProps';

function I12px_shapePolygon(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px shape polygon';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m5.234,1.52l-3.524,2.83c-.374.3-.54.792-.424,1.26l1.049,4.209c.137.548.627.932,1.189.932h4.951c.562,0,1.053-.384,1.189-.932l1.049-4.209c.116-.467-.049-.959-.424-1.26l-3.524-2.83c-.448-.36-1.084-.36-1.532,0h0Z"
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

export default I12px_shapePolygon;
