import React from 'react';

import { iconProps } from './iconProps';

function I12px_compass(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px compass';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m6,0C2.691,0,0,2.691,0,6s2.691,6,6,6,6-2.691,6-6S9.309,0,6,0Zm2.665,3.688l-1.232,2.875c-.168.391-.479.703-.87.87l-2.875,1.232c-.223.095-.448-.13-.353-.353l1.232-2.875c.168-.391.479-.703.87-.87l2.875-1.232c.223-.096.448.13.353.353Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_compass;
