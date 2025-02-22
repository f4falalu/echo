import React from 'react';
import { iconProps } from './iconProps';

function alertWarning(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px alert warning';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9 2.75L9 10.75"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M9,16c.551,0,1-.449,1-1s-.449-1-1-1-1,.449-1,1,.449,1,1,1Z" fill={secondaryfill} />
      </g>
    </svg>
  );
}

export default alertWarning;
