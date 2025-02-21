import React from 'react';

import { iconProps } from './iconProps';

function borderWidth(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'border width';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M16.25,14H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h14.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
        />
        <rect height="3.5" width="16" fill={secondaryfill} rx="1.25" ry="1.25" x="1" y="9" />
        <rect height="5.5" width="16" fill={fill} rx="1.25" ry="1.25" x="1" y="2" />
      </g>
    </svg>
  );
}

export default borderWidth;
