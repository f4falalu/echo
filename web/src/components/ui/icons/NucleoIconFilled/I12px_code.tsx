import React from 'react';

import { iconProps } from './iconProps';

function I12px_code(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px code';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m7.811,10.189c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.909-2.909-2.909-2.909c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.439,3.439c.293.293.293.768,0,1.061l-3.439,3.439c-.146.146-.338.22-.53.22Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m4.189,10.189c-.192,0-.384-.073-.53-.22L.22,6.53c-.293-.293-.293-.768,0-1.061l3.439-3.439c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-2.909,2.909,2.909,2.909c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_code;
