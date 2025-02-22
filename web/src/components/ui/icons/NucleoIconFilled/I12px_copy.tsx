import React from 'react';

import { iconProps } from './iconProps';

function I12px_copy(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px copy';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m8.25,12H2.25c-1.24,0-2.25-1.009-2.25-2.25V3.75c0-.414.336-.75.75-.75s.75.336.75.75v6c0,.414.337.75.75.75h6c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <rect height="9.5" width="9.5" fill={fill} rx="2.25" ry="2.25" strokeWidth="0" x="2.5" />
      </g>
    </svg>
  );
}

export default I12px_copy;
