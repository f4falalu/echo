import React from 'react';
import { iconProps } from './iconProps';

function cubes2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px cubes 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M5.25 9.896L5.25 5.5"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.83 3.83L5.25 5.5 1.67 3.829"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.387v3.226c0,.389-.225,.742-.577,.906l-2.75,1.283c-.268,.125-.578,.125-.846,0l-2.75-1.283c-.352-.164-.577-.518-.577-.906v-3.226c0-.389,.225-.742,.577-.906l2.75-1.283c.268-.125,.578-.125,.846,0l2.75,1.283c.352,.164,.577,.518,.577,.906Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 9.896L12.75 5.5"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.17 3.83L12.75 5.5 16.33 3.829"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.387v3.226c0,.389,.225,.742,.577,.906l2.75,1.283c.268,.125,.578,.125,.846,0l2.75-1.283c.352-.164,.577-.518,.577-.906v-3.226c0-.389-.225-.742-.577-.906l-2.75-1.283c-.268-.125-.578-.125-.846,0l-2.75,1.283c-.352,.164-.577,.518-.577,.906Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 16.146L9 11.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.58 10.08L9 11.75 5.42 10.079"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,10.637v3.226c0,.389-.225,.742-.577,.906l-2.75,1.283c-.268,.125-.578,.125-.846,0l-2.75-1.283c-.352-.164-.577-.518-.577-.906v-3.226c0-.389,.225-.742,.577-.906l2.75-1.283c.268-.125,.578-.125,.846,0l2.75,1.283c.352,.164,.577,.518,.577,.906Z"
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

export default cubes2;
