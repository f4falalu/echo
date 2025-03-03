import React from 'react';

import { iconProps } from './iconProps';

function align3Right(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'align 3 right';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="6" width="14" fill={fill} rx="2.25" ry="2.25" x="2" y="2" />
        <rect height="6" width="8" fill={secondaryfill} rx="2.25" ry="2.25" x="8" y="10" />
      </g>
    </svg>
  );
}

export default align3Right;
