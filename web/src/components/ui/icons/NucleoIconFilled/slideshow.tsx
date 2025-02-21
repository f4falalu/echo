import React from 'react';

import { iconProps } from './iconProps';

function slideshow(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'slideshow';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="5" cy="16" fill={secondaryfill} r="1" />
        <circle cx="13" cy="16" fill={secondaryfill} r="1" />
        <circle cx="9" cy="16" fill={secondaryfill} r="1.25" />
        <rect height="11.5" width="16" fill={fill} rx="2.75" ry="2.75" x="1" y="2" />
      </g>
    </svg>
  );
}

export default slideshow;
