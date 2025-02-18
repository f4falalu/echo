import React from 'react';

import { iconProps } from './iconProps';

function caretMinimizeDiagonal2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px caret minimize diagonal 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.896,6h-3.896c-.551,0-1,.449-1,1v3.896c0,.406.243.769.618.924.125.051.254.076.383.076.26,0,.515-.102.706-.293l3.896-3.896c.287-.287.372-.715.217-1.09s-.518-.617-.924-.617Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m5.383.18c-.375-.156-.802-.071-1.09.217L.396,4.293c-.287.287-.372.715-.217,1.09s.518.617.924.617h3.896c.551,0,1-.449,1-1V1.104c0-.406-.242-.769-.617-.924Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default caretMinimizeDiagonal2;
