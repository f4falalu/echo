import React from 'react';

import { iconProps } from './iconProps';

function section(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px section';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.25,1.5H1.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h8.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m10.25,12H1.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h8.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <rect height="6" width="12" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" y="3" />
      </g>
    </svg>
  );
}

export default section;
