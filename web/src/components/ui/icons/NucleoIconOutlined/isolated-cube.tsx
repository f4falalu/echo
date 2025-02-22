import React from 'react';
import { iconProps } from './iconProps';

function isolatedCube(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px isolated cube';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="2" cy="2" fill={secondaryfill} r="1" />
        <circle cx="16" cy="2" fill={secondaryfill} r="1" />
        <circle cx="2" cy="16" fill={secondaryfill} r="1" />
        <circle cx="16" cy="16" fill={secondaryfill} r="1" />
        <path
          d="M8.157,3.399l-3.57,2.071c-.518,.301-.837,.854-.837,1.453v4.155c0,.599,.319,1.153,.837,1.453l3.57,2.071c.521,.302,1.165,.302,1.686,0l3.57-2.071c.518-.301,.837-.854,.837-1.453V6.923c0-.599-.319-1.153-.837-1.453l-3.57-2.071c-.521-.302-1.165-.302-1.686,0Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.026 6.085L9 9 3.974 6.085"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 14.828L9 9"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default isolatedCube;
