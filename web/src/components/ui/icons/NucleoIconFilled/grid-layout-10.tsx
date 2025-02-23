import React from 'react';

import { iconProps } from './iconProps';

function gridLayout10(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'grid layout 10';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="15" width="4" fill={secondaryfill} rx="1.75" ry="1.75" x="12.5" y="1.5" />
        <rect height="4" width="9.5" fill={fill} rx="1.75" ry="1.75" x="1.5" y="7" />
        <rect height="4" width="9.5" fill={fill} rx="1.75" ry="1.75" x="1.5" y="12.5" />
        <rect height="4" width="9.5" fill={fill} rx="1.75" ry="1.75" x="1.5" y="1.5" />
      </g>
    </svg>
  );
}

export default gridLayout10;
