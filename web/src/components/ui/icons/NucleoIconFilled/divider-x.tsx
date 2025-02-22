import React from 'react';

import { iconProps } from './iconProps';

function dividerX(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'divider x';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m15.25,2h-1c-1.517,0-2.75,1.233-2.75,2.75v8.5c0,1.517,1.233,2.75,2.75,2.75h1c.414,0,.75-.336.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m3.75,2h-1c-.414,0-.75.336-.75.75v12.5c0,.414.336.75.75.75h1c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m9,1.25c-.414,0-.75.336-.75.75v14c0,.414.336.75.75.75s.75-.336.75-.75V2c0-.414-.336-.75-.75-.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default dividerX;
