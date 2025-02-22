import React from 'react';

import { iconProps } from './iconProps';

function post2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'post 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m15.25,11H2.75c-.4141,0-.75.3359-.75.75s.3359.75.75.75h12.5c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m9.25,14.5H2.75c-.4141,0-.75.3359-.75.75s.3359.75.75.75h6.5c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <circle cx="5.5" cy="5.5" fill={secondaryfill} r="3.5" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default post2;
