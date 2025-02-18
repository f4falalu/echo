import React from 'react';

import { iconProps } from './iconProps';

function borderTop(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px border top';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="4.417" cy="10.75" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="7.583" cy="10.75" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="10.75" cy="10.75" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="10.75" cy="4.417" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="10.75" cy="7.583" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="1.25" cy="4.417" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="1.25" cy="7.583" fill={secondaryfill} r=".75" strokeWidth="0" />
        <circle cx="1.25" cy="10.75" fill={secondaryfill} r=".75" strokeWidth="0" />
        <path
          d="m10.75,2H1.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h9.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default borderTop;
