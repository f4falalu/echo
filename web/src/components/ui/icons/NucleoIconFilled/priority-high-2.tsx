import React from 'react';

import { iconProps } from './iconProps';

function priorityHigh2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'priority high 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m14.75,16h-.5c-.9648,0-1.75-.7852-1.75-1.75V3.75c0-.9648.7852-1.75,1.75-1.75h.5c.9648,0,1.75.7852,1.75,1.75v10.5c0,.9648-.7852,1.75-1.75,1.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m9.25,16h-.5c-.9648,0-1.75-.7852-1.75-1.75v-5.5c0-.9648.7852-1.75,1.75-1.75h.5c.9648,0,1.75.7852,1.75,1.75v5.5c0,.9648-.7852,1.75-1.75,1.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <rect
          height="5"
          width="4"
          fill={secondaryfill}
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="1.5"
          y="11"
        />
      </g>
    </svg>
  );
}

export default priorityHigh2;
