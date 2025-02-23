import React from 'react';

import { iconProps } from './iconProps';

function gridLayout8(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'grid layout 8';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="4" width="9" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" x="7" y="2" />
        <rect
          height="4"
          width="4"
          fill={secondaryfill}
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="7"
          y="7"
        />
        <rect height="9" width="4" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" x="12" y="7" />
        <rect
          height="4"
          width="4"
          fill={secondaryfill}
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="7"
          y="12"
        />
        <rect height="14" width="4" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" x="2" y="2" />
      </g>
    </svg>
  );
}

export default gridLayout8;
