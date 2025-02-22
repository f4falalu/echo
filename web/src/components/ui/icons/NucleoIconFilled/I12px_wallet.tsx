import React from 'react';

import { iconProps } from './iconProps';

function I12px_wallet(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px wallet';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m.75,3c-.414,0-.75-.336-.75-.75C0,1.009,1.01,0,2.25,0h5c.414,0,.75.336.75.75s-.336.75-.75.75H2.25c-.413,0-.75.336-.75.75s-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m10.25,3H2.25c-.413,0-.75-.336-.75-.75s-.336-.75-.75-.75-.75.336-.75.75v6c0,1.517,1.233,2.75,2.75,2.75h7.5c.965,0,1.75-.785,1.75-1.75v-4.5c0-.965-.785-1.75-1.75-1.75Zm-2.25,5c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_wallet;
