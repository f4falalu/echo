import React from 'react';
import { iconProps } from './iconProps';

function I12px_paintbrush(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px paintbrush';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m6.206,7.791l4.63-4.627c.552-.552.552-1.448,0-2s-1.448-.552-2,0l-4.627,4.629"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m.75,11.25s-.049-3.404,1.386-4.838c.911-.911,2.423-.877,3.376.076s.987,2.465.076,3.376c-1.451,1.451-4.838,1.386-4.838,1.386Z"
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

export default I12px_paintbrush;
