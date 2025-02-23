import React from 'react';

import { iconProps } from './iconProps';

function I12px_tableRowNewBottom2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px table row new bottom 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="5.5" width="12" fill={fill} rx="2.25" ry="2.25" strokeWidth="0" />
        <path
          d="m8,8.5h-1.25v-1.25c0-.414-.336-.75-.75-.75s-.75.336-.75.75v1.25h-1.25c-.414,0-.75.336-.75.75s.336.75.75.75h1.25v1.25c0,.414.336.75.75.75s.75-.336.75-.75v-1.25h1.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_tableRowNewBottom2;
