import React from 'react';

import { iconProps } from './iconProps';

function I12px_clone(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px clone';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m9.75,12h-4.5c-1.241,0-2.25-1.009-2.25-2.25v-1.5c0-.414.336-.75.75-.75s.75.336.75.75v1.5c0,.414.336.75.75.75h4.5c.414,0,.75-.336.75-.75v-4.5c0-.414-.336-.75-.75-.75h-1.417c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h1.417c1.241,0,2.25,1.009,2.25,2.25v4.5c0,1.241-1.009,2.25-2.25,2.25Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <rect height="9" width="9" fill={fill} rx="2.25" ry="2.25" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default I12px_clone;
