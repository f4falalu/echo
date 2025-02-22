import React from 'react';

import { iconProps } from './iconProps';

function gridLayoutRows(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'grid layout rows';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect
          height="6"
          width="14"
          fill={secondaryfill}
          rx="2.25"
          ry="2.25"
          strokeWidth="0"
          x="2"
          y="10"
        />
        <rect height="6" width="14" fill={fill} rx="2.25" ry="2.25" strokeWidth="0" x="2" y="2" />
      </g>
    </svg>
  );
}

export default gridLayoutRows;
