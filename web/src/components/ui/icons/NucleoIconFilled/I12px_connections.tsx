import React from 'react';

import { iconProps } from './iconProps';

function I12px_connections(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px connections';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m6,4.939l2.875-2.875-1.464-1.463c-.754-.754-2.068-.754-2.822,0l-1.464,1.463,2.875,2.875Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m2.064,8.875l2.875-2.875-2.875-2.875-1.464,1.463c-.777.778-.777,2.045,0,2.823l1.464,1.463Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m6,7.061l-2.875,2.875,1.464,1.463c.377.377.878.585,1.411.585s1.034-.208,1.411-.585l1.464-1.463-2.875-2.875Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m9.936,3.125l-2.875,2.875,2.875,2.875,1.464-1.463c.777-.778.777-2.045,0-2.823l-1.464-1.463Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_connections;
