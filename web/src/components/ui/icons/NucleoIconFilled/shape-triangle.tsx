import React from 'react';

import { iconProps } from './iconProps';

function shapeTriangle(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'shape triangle';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M16.437,12.516L11.011,3.12c-.419-.727-1.171-1.161-2.011-1.161s-1.592,.434-2.011,1.161L1.563,12.516c-.42,.728-.42,1.596,0,2.323s1.172,1.161,2.011,1.161H14.425c.839,0,1.591-.434,2.011-1.161s.42-1.595,0-2.323Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default shapeTriangle;
