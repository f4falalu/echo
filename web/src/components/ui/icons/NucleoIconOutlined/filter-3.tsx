import React from 'react';
import { iconProps } from './iconProps';

function filter3(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px filter 3';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M10.25 15.75L7.75 17.25 7.75 12.25 3.75 6.75 14.25 6.75 10.25 12.25 10.25 15.75z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M9,2c.552,0,1-.449,1-1s-.448-1-1-1-1,.449-1,1,.448,1,1,1Z" fill={secondaryfill} />
        <path
          d="M5.5,2c.552,0,1-.449,1-1s-.448-1-1-1-1,.449-1,1,.448,1,1,1Z"
          fill={secondaryfill}
        />
        <path
          d="M12.5,2c.552,0,1-.449,1-1s-.448-1-1-1-1,.449-1,1,.448,1,1,1Z"
          fill={secondaryfill}
        />
        <path
          d="M10.75,4.5c.552,0,1-.449,1-1s-.448-1-1-1-1,.449-1,1,.448,1,1,1Z"
          fill={secondaryfill}
        />
        <path
          d="M7.25,4.5c.552,0,1-.449,1-1s-.448-1-1-1-1,.449-1,1,.448,1,1,1Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default filter3;
