import React from 'react';

import { iconProps } from './iconProps';

function I12px_book2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px book 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.25,12H3.25c-1.241,0-2.25-1.009-2.25-2.25,0-.414.336-.75.75-.75s.75.336.75.75.336.75.75.75h7c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m8.75,0H3.25C2.009,0,1,1.009,1,2.25v7.5c0,.414.336.75.75.75s.75-.336.75-.75.336-.75.75-.75h7c.414,0,.75-.336.75-.75V2.25c0-1.241-1.009-2.25-2.25-2.25Zm-1.5,5h-2.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_book2;
