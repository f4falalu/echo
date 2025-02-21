import React from 'react';

import { iconProps } from './iconProps';

function gridLayout3(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'grid layout 3';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="14" width="4.5" fill={secondaryfill} rx="1.75" ry="1.75" x="1" y="2" />
        <rect height="8" width="10" fill={fill} rx="1.75" ry="1.75" x="7" y="8" />
        <rect height="4.5" width="10" fill={fill} rx="1.75" ry="1.75" x="7" y="2" />
      </g>
    </svg>
  );
}

export default gridLayout3;
