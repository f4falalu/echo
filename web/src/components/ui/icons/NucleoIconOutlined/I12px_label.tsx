import React from 'react';
import { iconProps } from './iconProps';

function I12px_label(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px label';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m2.088,3.868l3.25-2.868c.378-.334.945-.334,1.323,0l3.25,2.868c.215.19.338.463.338.75v4.133c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2v-4.133c0-.287.123-.56.338-.75Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="5" fill={secondaryfill} r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default I12px_label;
