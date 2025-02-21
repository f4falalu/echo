import React from 'react';

import { iconProps } from './iconProps';

function I12px_gridLayoutCols(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px grid layout cols';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect
          height="11"
          width="5"
          fill={secondaryfill}
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="6.5"
          y=".5"
        />
        <rect height="11" width="5" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" x=".5" y=".5" />
      </g>
    </svg>
  );
}

export default I12px_gridLayoutCols;
