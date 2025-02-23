import React from 'react';
import { iconProps } from './iconProps';

function messages(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px messages';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9.25,6.25h5.5c.828,0,1.5,.672,1.5,1.5v4.5c0,.828-.672,1.5-1.5,1.5h-.5v2.5s-2.75-2.5-2.75-2.5h-2.25c-.828,0-1.5-.672-1.5-1.5V7.75c0-.828,.672-1.5,1.5-1.5Z"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.937,3.75c-.222-.862-1.005-1.5-1.937-1.5H3.75c-1.105,0-2,.895-2,2v5.001c0,1.104,.896,2,2,1.999h0s0,3,0,3l1.5-1.636"
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

export default messages;
