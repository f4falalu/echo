import React from 'react';

import { iconProps } from './iconProps';

function ballotCircle(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px ballot circle';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m11.25,4h-5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m11.25,9.5h-5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <circle cx="2" cy="3" fill={fill} r="2" strokeWidth="0" />
        <circle cx="2" cy="9" fill={fill} r="2" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default ballotCircle;
