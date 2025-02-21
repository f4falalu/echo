import React from 'react';

import { iconProps } from './iconProps';

function squareGrid2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'square grid 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75v8.5c0,1.517,1.233,2.75,2.75,2.75h8.5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-5.25,10.75c0,.414-.336.75-.75.75h-2c-.414,0-.75-.336-.75-.75v-2c0-.414.336-.75.75-.75h2c.414,0,.75.336.75.75v2Zm0-5.5c0,.414-.336.75-.75.75h-2c-.414,0-.75-.336-.75-.75v-2c0-.414.336-.75.75-.75h2c.414,0,.75.336.75.75v2Zm5.5,5.5c0,.414-.336.75-.75.75h-2c-.414,0-.75-.336-.75-.75v-7.5c0-.414.336-.75.75-.75h2c.414,0,.75.336.75.75v7.5Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default squareGrid2;
