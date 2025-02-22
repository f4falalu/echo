import React from 'react';

import { iconProps } from './iconProps';

function I12px_gridPlus2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px grid plus 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m4.75,8.5h-1.25v-1.25c0-.414-.336-.75-.75-.75s-.75.336-.75.75v1.25H.75c-.414,0-.75.336-.75.75s.336.75.75.75h1.25v1.25c0,.414.336.75.75.75s.75-.336.75-.75v-1.25h1.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m11.25,2h-1.25V.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v1.25h-1.25c-.414,0-.75.336-.75.75s.336.75.75.75h1.25v1.25c0,.414.336.75.75.75s.75-.336.75-.75v-1.25h1.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m11.25,8.5h-1.25v-1.25c0-.414-.336-.75-.75-.75s-.75.336-.75.75v1.25h-1.25c-.414,0-.75.336-.75.75s.336.75.75.75h1.25v1.25c0,.414.336.75.75.75s.75-.336.75-.75v-1.25h1.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m4.75,2h-1.25V.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v1.25H.75c-.414,0-.75.336-.75.75s.336.75.75.75h1.25v1.25c0,.414.336.75.75.75s.75-.336.75-.75v-1.25h1.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_gridPlus2;
