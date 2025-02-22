import React from 'react';
import { iconProps } from './iconProps';

function heartLock(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px heart lock';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect
          height="3.5"
          width="6"
          fill="none"
          rx="1"
          ry="1"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="10.25"
          y="13.75"
        />
        <path
          d="M11.75,13.75v-1.5c0-.828,.672-1.5,1.5-1.5h0c.828,0,1.5,.672,1.5,1.5v1.5"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.566,9.017c.27-.743,.434-1.544,.434-2.408,.008-2.12-1.704-3.846-3.827-3.859-1.277,.016-2.464,.66-3.173,1.72-.71-1.061-1.896-1.704-3.173-1.72-2.123,.013-3.834,1.739-3.827,3.859,0,4.191,3.737,6.979,5.75,8.177"
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

export default heartLock;
