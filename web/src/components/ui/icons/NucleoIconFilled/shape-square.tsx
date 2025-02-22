import React from 'react';

import { iconProps } from './iconProps';

function shapeSquare(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'shape square';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="14" width="14" fill={fill} rx="2.75" ry="2.75" x="2" y="2" />
      </g>
    </svg>
  );
}

export default shapeSquare;
