import React from 'react';

import { iconProps } from './iconProps';

function I12px_gridCircle(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px grid circle';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="9" cy="3" fill={secondaryfill} r="2.5" strokeWidth="0" />
        <circle cx="3" cy="9" fill={secondaryfill} r="2.5" strokeWidth="0" />
        <circle cx="3" cy="3" fill={fill} r="2.5" strokeWidth="0" />
        <circle cx="9" cy="9" fill={fill} r="2.5" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default I12px_gridCircle;
