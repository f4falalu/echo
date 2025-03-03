import React from 'react';

import { iconProps } from './iconProps';

function stack3(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'stack 3';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="12" width="15" fill={fill} rx="2.75" ry="2.75" x="1.5" y="2" />
        <path
          d="M13.25,15.5H4.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H13.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default stack3;
