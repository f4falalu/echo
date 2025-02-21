import React from 'react';

import { iconProps } from './iconProps';

function I12px_chevronMaximizeDiagonal2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px chevron maximize diagonal 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m1.75,6.5c-.414,0-.75-.336-.75-.75V1.75c0-.414.336-.75.75-.75h4c.414,0,.75.336.75.75s-.336.75-.75.75h-3.25v3.25c0,.414-.336.75-.75.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m10.25,11h-4c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h3.25v-3.25c0-.414.336-.75.75-.75s.75.336.75.75v4c0,.414-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_chevronMaximizeDiagonal2;
