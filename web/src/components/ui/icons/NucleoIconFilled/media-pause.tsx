import React from 'react';

import { iconProps } from './iconProps';

function mediaPause(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'media pause';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="14" width="5" fill={fill} rx="1.75" ry="1.75" x="2" y="2" />
        <rect height="14" width="5" fill={secondaryfill} rx="1.75" ry="1.75" x="11" y="2" />
      </g>
    </svg>
  );
}

export default mediaPause;
