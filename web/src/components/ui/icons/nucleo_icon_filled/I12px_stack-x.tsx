import React from 'react';

import { iconProps } from './iconProps';

function I12px_stackX(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px stack x';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="10" width="6" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" x="3" y="1" />
        <path
          d="m11.25,11c-.414,0-.75-.336-.75-.75V1.75c0-.414.336-.75.75-.75s.75.336.75.75v8.5c0,.414-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m.75,11c-.414,0-.75-.336-.75-.75V1.75c0-.414.336-.75.75-.75s.75.336.75.75v8.5c0,.414-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_stackX;
