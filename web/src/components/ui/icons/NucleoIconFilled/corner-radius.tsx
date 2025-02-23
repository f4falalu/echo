import React from 'react';

import { iconProps } from './iconProps';

function cornerRadius(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'corner radius';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m2.75,16c-.4141,0-.75-.3359-.75-.75v-6.5c0-3.7222,3.0278-6.75,6.75-6.75h6.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75h-6.5c-2.895,0-5.25,2.355-5.25,5.25v6.5c0,.4141-.3359.75-.75.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default cornerRadius;
