import React from 'react';

import { iconProps } from './iconProps';

function circles5(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'circles 5';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="9" cy="9" fill={fill} r="5" />
        <circle cx="3.25" cy="3.25" fill={secondaryfill} r="1.25" />
        <circle cx="14.75" cy="3.25" fill={secondaryfill} r="1.25" />
        <circle cx="3.25" cy="14.75" fill={secondaryfill} r="1.25" />
        <circle cx="14.75" cy="14.75" fill={secondaryfill} r="1.25" />
      </g>
    </svg>
  );
}

export default circles5;
