import React from 'react';

import { iconProps } from './iconProps';

function chartBarAxisY(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'chart bar axis y';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M2.75,1c-.414,0-.75,.336-.75,.75v14.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V1.75c0-.414-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
        <rect height="4" width="11.5" fill={fill} rx="1.75" ry="1.75" x="4.5" y="7" />
        <rect height="4" width="7.5" fill={fill} rx="1.75" ry="1.75" x="4.5" y="2" />
        <rect height="4" width="4.5" fill={fill} rx="1.75" ry="1.75" x="4.5" y="12" />
      </g>
    </svg>
  );
}

export default chartBarAxisY;
