import React from 'react';

import { iconProps } from './iconProps';

function I12px_shapePolygon(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px shape polygon';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m7.235.935c-.727-.584-1.743-.584-2.47,0h0L1.241,3.764c-.6.482-.868,1.277-.682,2.026l1.048,4.209c.22.884,1.009,1.501,1.917,1.501h4.951c.908,0,1.697-.617,1.917-1.501l1.048-4.208c.187-.748-.081-1.543-.682-2.026L7.235.935Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_shapePolygon;
