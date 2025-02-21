import React from 'react';

import { iconProps } from './iconProps';

function dumbbell(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'dumbbell';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M17,9.75H1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H17c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M4,2.5c-1.103,0-2,.897-2,2V13.5c0,1.103,.897,2,2,2s2-.897,2-2V4.5c0-1.103-.897-2-2-2Z"
          fill={fill}
        />
        <path
          d="M14,2.5c-1.103,0-2,.897-2,2V13.5c0,1.103,.897,2,2,2s2-.897,2-2V4.5c0-1.103-.897-2-2-2Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default dumbbell;
