import React from 'react';

import { iconProps } from './iconProps';

function alertInfo(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'alert info';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m9,16c-.4141,0-.75-.3359-.75-.75V6.75c0-.4141.3359-.75.75-.75s.75.3359.75.75v8.5c0,.4141-.3359.75-.75.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m9,2c-.551,0-1,.449-1,1s.449,1,1,1,1-.449,1-1-.449-1-1-1Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default alertInfo;
