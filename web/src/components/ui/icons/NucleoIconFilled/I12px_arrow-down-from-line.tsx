import React from 'react';

import { iconProps } from './iconProps';

function I12px_arrowDownFromLine(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px arrow down from line';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.75,2H1.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h9.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m8.47,7.22l-1.72,1.72v-4.689c0-.414-.336-.75-.75-.75s-.75.336-.75.75v4.689l-1.72-1.72c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l3,3c.146.146.338.22.53.22s.384-.073.53-.22l3-3c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_arrowDownFromLine;
