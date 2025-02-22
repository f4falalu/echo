import React from 'react';

import { iconProps } from './iconProps';

function chartBubble(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'chart bubble';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="11.75" cy="14" fill={fill} r="2.5" />
        <circle cx="12.25" cy="5.75" fill={secondaryfill} r="4.25" />
        <circle cx="4.5" cy="11" fill={fill} r="3" />
      </g>
    </svg>
  );
}

export default chartBubble;
