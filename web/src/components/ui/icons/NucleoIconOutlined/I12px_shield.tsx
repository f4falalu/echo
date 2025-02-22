import React from 'react';
import { iconProps } from './iconProps';

function I12px_shield(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px shield';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m6,.75l4.25,1.75v4.969c0,2.201-3.185,3.449-4.041,3.745-.138.048-.281.048-.419,0-.855-.296-4.041-1.544-4.041-3.745V2.5L6,.75s0,0,0,0Z"
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

export default I12px_shield;
