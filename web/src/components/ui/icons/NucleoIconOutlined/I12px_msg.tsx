import React from 'react';
import { iconProps } from './iconProps';

function I12px_msg(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px msg';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m6,.75C3.101.75.75,3.1.75,6c0,1.082.329,2.088.89,2.923-.187.776-.474,1.551-.89,2.327,1.161,0,2.138-.191,2.953-.55.696.341,1.469.55,2.297.55,2.899,0,5.25-2.351,5.25-5.25S8.899.75,6,.75Z"
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

export default I12px_msg;
