import React from 'react';

import { iconProps } from './iconProps';

function chevronMaximizeDiagonal2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'chevron maximize diagonal 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M8.25,3H3.75c-.414,0-.75,.336-.75,.75v4.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.75h3.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
        />
        <path
          d="M14.25,9c-.414,0-.75,.336-.75,.75v3.75h-3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.5c.414,0,.75-.336,.75-.75v-4.5c0-.414-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default chevronMaximizeDiagonal2;
