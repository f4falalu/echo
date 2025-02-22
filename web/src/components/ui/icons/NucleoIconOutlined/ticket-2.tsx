import React from 'react';
import { iconProps } from './iconProps';

function ticket2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px ticket 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.5,9c0-.967,.784-1.75,1.75-1.75v-1.5c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v1.5c.966,0,1.75,.783,1.75,1.75s-.784,1.75-1.75,1.75v1.5c0,1.104,.895,2,2,2H14.25c1.105,0,2-.896,2-2v-1.5c-.966,0-1.75-.783-1.75-1.75Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="11.25" cy="8.875" fill={secondaryfill} r=".75" />
        <circle cx="11.25" cy="6.25" fill={secondaryfill} r=".75" />
        <circle cx="11.25" cy="11.75" fill={secondaryfill} r=".75" />
      </g>
    </svg>
  );
}

export default ticket2;
