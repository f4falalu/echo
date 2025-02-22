import React from 'react';
import { iconProps } from './iconProps';

function label3(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px label 3';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M4.75,3.75h7.773c.302,0,.587,.136,.777,.371l3.95,4.879-3.95,4.879c-.19,.235-.475,.371-.777,.371H4.75c-1.105,0-2-.895-2-2V5.75c0-1.105,.895-2,2-2Z"
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

export default label3;
