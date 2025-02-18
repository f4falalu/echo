import React from 'react';

import { iconProps } from './iconProps';

function I12px_squareLayoutGrid2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px square layout grid 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m6.75,5.25h4.75v-2c0-1.517-1.233-2.75-2.75-2.75h-2v4.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m5.25.5h-2C1.733.5.5,1.733.5,3.25v5.5c0,1.517,1.233,2.75,2.75,2.75h2V.5Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m6.75,6.75v4.75h2c1.517,0,2.75-1.233,2.75-2.75v-2h-4.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_squareLayoutGrid2;
