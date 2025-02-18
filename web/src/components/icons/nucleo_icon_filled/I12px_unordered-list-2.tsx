import React from 'react';

import { iconProps } from './iconProps';

function I12px_unorderedList2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px unordered list 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="1.5" cy="1.75" fill={fill} r="1.5" strokeWidth="0" />
        <circle cx="1.5" cy="6" fill={secondaryfill} r="1.5" strokeWidth="0" />
        <circle cx="1.5" cy="10.25" fill={fill} r="1.5" strokeWidth="0" />
        <path
          d="m11.25,1h-6.25c-.414,0-.75.336-.75.75s.336.75.75.75h6.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m11.25,5.25h-6.25c-.414,0-.75.336-.75.75s.336.75.75.75h6.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m11.25,9.5h-6.25c-.414,0-.75.336-.75.75s.336.75.75.75h6.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_unorderedList2;
