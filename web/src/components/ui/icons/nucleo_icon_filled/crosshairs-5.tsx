import React from 'react';

import { iconProps } from './iconProps';

function crosshairs5(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'crosshairs 5';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="9" cy="9" fill={secondaryfill} r="3" />
        <path
          d="M9,4c.414,0,.75-.336,.75-.75V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.5c0,.414,.336,.75,.75,.75Z"
          fill={fill}
        />
        <path
          d="M16.25,8.25h-1.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
        />
        <path
          d="M9,14c-.414,0-.75,.336-.75,.75v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5c0-.414-.336-.75-.75-.75Z"
          fill={fill}
        />
        <path
          d="M3.25,8.25H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default crosshairs5;
