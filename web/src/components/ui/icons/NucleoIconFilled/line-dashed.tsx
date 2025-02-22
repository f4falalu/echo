import React from 'react';

import { iconProps } from './iconProps';

function lineDashed(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'line dashed';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m4.75,9.75h-2c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h2c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m10,9.75h-2c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h2c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m15.25,9.75h-2c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h2c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default lineDashed;
