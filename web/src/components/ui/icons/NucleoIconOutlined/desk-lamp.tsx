import React from 'react';
import { iconProps } from './iconProps';

function deskLamp(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px desk lamp';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M3.75 15.25L12.25 15.25"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.879,7.148l-1.912,1.711c-.4,.358-.446,.968-.104,1.382l4.138,5.009"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.957,3.504l-1.231-.846c-.408-.28-.966-.177-1.246,.231l-.578,.841c-.28,.408-.177,.966,.231,1.246l1.231,.846c.985,.677,.6,3.313,2.585,4.678l4.302-6.257c-1.954-1.344-4.309-.062-5.293-.739Z"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default deskLamp;
